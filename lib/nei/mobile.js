/*
 * Mobile builder base class
 * @module   nei/mobile
 * @author   genify(caijf@corp.netease.com)
 */
var path = require('path');
var util = require('util');
var url = require('url');
var _util = require('../util/util.js');
var TPL_ROOT = __dirname + '/mobile/template/';
var Mobile = module.exports = require('../util/klass.js').create();
var pro = Mobile.extend(require('./builder.js'));

/**
 * filter config field from input
 * @param  {Object} config - config data
 * @return {Object} result will be save to config file
 */
pro._filter = function (config) {
    this._super(config);
    // TODO
};

/**
 * init template
 * @return {Void}
 */
pro._template = function () {
    this._super();
    this._parseTemplate(TPL_ROOT);
};

/**
 * format config data
 * @protected
 * @param  {Object} data - config data
 * @return {Void}
 */
pro._format = function (data) {
    this._super(data);
    // TODO
};


/**
 * update project
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._update = function (config, options, data) {
    // TODO
};

/**
 * do something before build done
 * @param  {Object} config - nei config will be outputted
 * @return {Void}
 */
pro._beforeDone = function (config) {
    // TODO
};

/**
 * export model
 * @param  {Object} config - config object
 * @param  {String} config.lang   - output language
 * @param  {String} config.author - author name
 * @param  {String} config.namePrefix  - Class Name Prefix
 * @param  {String} config.reqAbstract - Request Class Abstract Name
 * @return {Void}
 */
pro.initModConfig = function (config) {
    // save config
    var time = new Date();
    this._modConfig = {
        prefix: config.namePrefix || '',
        base: config.reqAbstract || '',
        model: config.modelAbstract || '',
        rheader: config.reqHeaders || '',
        mheader: config.modelHeaders || '',
        aPkg: config.appPackage || '',
        mPkg: config.modelPackage || '',
        htPkg: config.reqPackage || '',
        author: config.author,
        lang: config.lang,
        year: time.getFullYear(),
        month: time.getMonth() + 1,
        day: time.getDate()
    };
};

/**
 * sort interfaces by it's path
 * @protected
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._sortData = function (data) {
    data.interfaces.sort(function (a, b) {
        return a.path < b.path ? -1 : 1;
    });
};

// if resource is initialized
pro.isResourceInited = false;
// while diffing, new resource is added
pro.isResourceAdded = false;
// while diffing, some resource is deleted
pro.isResourceDeleted = false;
// while diffing, some resource is updated
pro.isResourceUpdated = false;

// diff data map
pro._diffMap = (function () {
    var paramMap = {
        type: 'array',
        values: {
            datatypeId: '数据类型id',
            name: '名称',
            type: '类型',
            isArray: '是否为数组',
            description: '描述',
            defaultValue: '默认值'
        }
    };
    var attrMap = {
        type: 'array',
        values: {
            name: '名称',
            type: '类型',
            isArray: '是否为数组',
            description: '描述',
            vkey: '键',
            defaultValue: '默认值'
        }
    };
    return {
        interfaces: {
            type: 'array',
            name: '接口',
            values: {
                name: '名称',
                className: '类名',
                description: '描述',
                path: '请求路径',
                method: '请求方法',
                inputs: Object.assign({}, paramMap, {
                    name: '输入参数'
                }),
                outputs: Object.assign({}, paramMap, {
                    name: '输出参数'
                }),
                headers: Object.assign({}, paramMap, {
                    name: '请求头参数'
                })
            }
        },
        datatypes: {
            type: 'object',
            name: '数据类型',
            values: {
                name: '名称',
                format: '类型',
                attrs: Object.assign({}, attrMap, {
                    name: '属性'
                })
            }
        }
    }
})();

/**
 * diff two objects
 * @param  {Object} oldData - old data object
 * @param  {Object} newData - new data object
 * @return {Object} returnObj
 *         {Array}  returnObj.diffDesc - changed description
 *         {Object} returnObj.diffs - contain changed resources
 *         {Array}  returnObj.diffs.datatypes - changed data type ids
 *         {Array}  returnObj.diffs.interfaces - changed interface ids
 */
pro._diff = function (oldData, newData) {
    var self = this;
    var diffs = {
        datatypes: {},
        interfaces: {}
    };
    var getTopmostParent = function (parent) {
        if (parent) {
            var p = parent;
            while (p.parent) {
                p = p.parent;
            }
            return p;
        }
    };
    var getDescPrefix = function (parent) {
        var conf = self._modConfig;
        parent = getTopmostParent(parent);
        var isModel = false;
        var getFilePath = function (name, isModel) {
            var file;
            if (conf.lang === 'java') {
                file = util.format(
                    '%s/%s/%s%s.java',
                    isModel ? 'Models' : 'HttpTasks',
                    conf.aPkg.replace(/\./g, '/'),
                    name,
                    isModel ? '' : 'HttpTask'
                );
                return file;
            } else if (conf.lang === 'oc') {
                file = util.format(
                    '%s/%s%s.h',
                    isModel ? 'Models' : 'Requests',
                    conf.prefix,
                    name
                );
                return file;
            }
        };
        isModel = parent.key === 'datatypes';
        return util.format(
            '%s%s：',
            isModel ? '模型' : '接口',
            getFilePath(parent.className, isModel)
        );
    };
    var getDescExp = function (options, noSuffix) {
        var result = '';
        if (!options) {
            return result;
        }
        result += options.prefix || '';
        result += util.format(
            '%s%s%s%s',
            typeof(options.index) === 'number' ? util.format('第%s个', options.index) : '',
            options.name,
            options.dataName ? util.format('"%s"', options.dataName) : '',
            noSuffix ? '' : '的'
        );
        return result;
    };
    var sepLine = (function () {
        var a = [];
        a.length = 100;
        return a.join('-');
    })();
    var setDiff = function (parent) {
        parent = getTopmostParent(parent);
        if (parent) {
            diffs[parent.key][parent.id] = 1;
            // update htVersion
            if (Array.isArray(newData[parent.key])) {
                var foundData = newData[parent.key].filter(function (data) {
                    return data.id === parent.id;
                });
                if (foundData.length === 1) {
                    foundData[0].htVersion += 1;
                }
            } else {
                newData[parent.key][parent.id].htVersion += 1;
            }
        }
    };
    var diffDesc = [];
    var prevLength = 0;
    var desc;
    var getClassName = function (data, type) {
        if (type === 'interfaces') {
            return self._getReqClassName(data);
        } else {
            return data.name;
        }
    };
    var changedFileNum = 0;
    var checkData = function (oData, nData, cMap, parent) {
        Object.keys(cMap).forEach(function (key) {
            var cObj = cMap[key];
            if (cObj.type === 'array') {
                oData[key].forEach(function (data, index) {
                    var foundResults = nData[key].filter(function (o) {
                        return o.id === data.id;
                    });
                    if (foundResults.length === 1) {
                        checkData(data, foundResults[0], cObj.values, {
                            id: data.id,
                            dataName: data.name,
                            className: getClassName(data, key),
                            key: key,
                            name: cObj.name,
                            index: index + 1,
                            prefix: getDescExp(parent),
                            parent: parent
                        });
                    } else {
                        desc = util.format(
                            '%s%s第%s个%s"%s"已被删除',
                            getDescPrefix(parent ||
                                {
                                    key: key,
                                    className: data.name
                                }
                            ),
                            getDescExp(parent),
                            index + 1,
                            cObj.name,
                            data.name
                        );
                        diffDesc.push(desc);
                        self.isResourceDeleted = true;
                    }
                });
                // 再判断新增的情况
                nData[key].forEach(function (data, index) {
                    var foundResults = oData[key].filter(function (o) {
                        return o.id === data.id;
                    });
                    if (foundResults.length === 0) {
                        setDiff(parent);
                        desc = util.format(
                            '%s%s新增了%s"%s"',
                            getDescPrefix(parent ||
                                {
                                    key: key,
                                    className: data.name
                                }
                            ),
                            getDescExp(parent, true),
                            cObj.name,
                            data.name
                        );
                        diffDesc.push(desc);
                        self.isResourceAdded = true;
                    }
                });
            } else if (cObj.type === 'object') {
                Object.keys(oData[key]).forEach(function (oKey) {
                    if (nData[key][oKey]) {
                        checkData(oData[key][oKey], nData[key][oKey], cObj.values, {
                            id: oKey,
                            key: key,
                            dataName: oData[key][oKey].name,
                            className: getClassName(oData[key][oKey], key),
                            name: cObj.name,
                            prefix: getDescExp(parent),
                            parent: parent
                        });
                    } else {
                        setDiff(parent);
                        desc = util.format(
                            '%s%s%s%s已被删除',
                            getDescPrefix(parent ||
                                {
                                    key: key,
                                    className: oData[key][oKey].name
                                }
                            ),
                            getDescExp(parent),
                            cObj.name,
                            util.format('"%s"', oData[key][oKey].name)
                        );
                        diffDesc.push(desc);
                        self.isResourceDeleted = true;
                    }
                });
                // 再判断新增的情况
                Object.keys(nData[key]).forEach(function (oKey) {
                    if (!oData[key].hasOwnProperty([oKey])) {
                        desc = util.format(
                            '%s新增了%s%s%s',
                            getDescPrefix(parent ||
                                {
                                    key: key,
                                    className: nData[key][oKey].name
                                }
                            ),
                            getDescExp(parent),
                            cObj.name,
                            util.format('"%s"', nData[key][oKey].name)
                        );
                        diffDesc.push(desc);
                        self.isResourceAdded = true;
                    }
                });
            } else {
                if (oData[key] !== nData[key]) {
                    setDiff(parent);
                    desc = util.format(
                        '%s%s"%s(%s)"已更改, 旧值是"%s", 新值是"%s"',
                        getDescPrefix(parent),
                        getDescExp(parent),
                        cObj,
                        key,
                        oData[key],
                        nData[key]
                    );
                    diffDesc.push(desc);
                    self.isResourceUpdated = true;
                }
            }
        });
        if (diffDesc.length !== prevLength) {
            diffDesc.push(sepLine);
            prevLength = diffDesc.length;
            changedFileNum++;
        }
    };
    checkData(oldData, newData, this._diffMap);
    diffs.datatypes = Object.keys(diffs.datatypes);
    diffs.interfaces = Object.keys(diffs.interfaces);
    return {
        diffDesc: diffDesc,
        changedNum: changedFileNum,
        diffs: diffs
    }
};

/**
 * check the local data, output file with version, output diff detail
 * @param  {Object} newData - new pulled data object
 * @param  {Object} config -
 * @param  {Function} callback
 * @return {Void}
 */
pro._checkData = function (newData, config, callback) {
    var self = this;
    var diffResult;
    var jsonFile = util.format(
        '%s%s/JSON/nei-latest.json',
        config.proRoot,
        config.id
    );
    newData.datatypes = this._types;
    var oldData = _util.file2json(jsonFile);
    var time = _util.getFormatTime('%s-%s-%s-%s-%s-%s-%s');
    var filePrefix = util.format(
        '%s%s/JSON/nei-%s',
        config.proRoot,
        config.id,
        time
    );
    if (Object.keys(oldData).length) {
        self.isResourceInited = true;
        // copy old version
        newData.htVersion = oldData.htVersion;
        Object.keys(newData.datatypes).forEach(function (dataTypeId) {
            var version = 0;
            if (oldData.datatypes[dataTypeId]) {
                version = oldData.datatypes[dataTypeId].htVersion;
            }
            newData.datatypes[dataTypeId].htVersion = version;
        });
        newData.interfaces.forEach(function (itf) {
            var version = 0;
            var foundOldItfs = oldData.interfaces.filter(function (itff) {
                return itff.id === itf.id;
            });
            if (foundOldItfs.length === 1) {
                version = foundOldItfs[0].htVersion;
            }
            itf.htVersion = version;
        });
        diffResult = self._diff(oldData, newData);
        var diffTxt = filePrefix + '-diff.txt';
        self._output(diffTxt, diffResult.diffDesc.join('\r\n'));
    } else {
        // set initial htVersion
        newData.htVersion = 0;
        Object.keys(newData.datatypes).forEach(function (dataTypeId) {
            newData.datatypes[dataTypeId].htVersion = 0;
        });
        newData.interfaces.forEach(function (itf) {
            itf.htVersion = 0;
        });
    }
    var isChanged = false;
    if (diffResult && diffResult.diffDesc.length) {
        isChanged = true;
        // update htVersion
        newData.htVersion += 1;
    }
    // out file with version, backup usage
    var file = filePrefix + '.json';
    var outputContent = JSON.stringify(newData, null, '\t');
    self._output(file, outputContent);
    // update latest file
    self._output(jsonFile, outputContent);
    // todo: 要不要排除把没有变化的数据？如果 diff 逻辑有误，导致无法生成变化的文件，这样用户还要等插件更新，整个过程可能比较痛苦。
    callback(newData);
    if (isChanged) {
        self.emit('debug', {
            message: util.format(
                'diff result: %s个文件被更改，请查看相应的diff.txt文件',
                diffResult.changedNum
            )
        });
    }
};

// split data type by enum type and common type
pro._splitDataType = function () {
    var ret = {
        enums: [],
        models: []
    };
    Object.keys(this._types).forEach(
        function (id) {
            var type = this._types[id];
            if (type.format == 1) {
                // for enum type
                ret.enums.push(type);
            } else {
                // for hash map
                var isAbstr = !1;
                type.attrs.forEach(function (it) {
                    if (it.type == 10000) {
                        isAbstr = !0;
                    }
                });
                if (!isAbstr) {
                    ret.models.push(id);
                }
            }
        }, this
    );
    return ret;
};

/**
 * check if params is an imported data type
 * @param  {Object} params - inputs or outputs
 * @return {Boolean}
 */
pro._isAnImportedDataType = function (params) {
    if (!params || !Array.isArray(params) || !params.length) {
        return false;
    }
    var datatypeId;
    for (var i = 0, l = params.length; i < l; i++) {
        if (!params[i].datatypeId) {
            return false;
        }
        if (!datatypeId) {
            datatypeId = params[i].datatypeId
        }
        if (datatypeId !== params[i].datatypeId) {
            return false;
        }
    }
    if (datatypeId) {
        return true;
    }
};

/**
 * check if params has only one custom data type
 * @param  {Object} params - inputs or outputs
 * @param  {Object} systemDataTypeMap - system data type map
 * @return {Boolean}
 */
pro._hasOnlyOneCustomDataType = function (params, systemDataTypeMap) {
    if (!params || !Array.isArray(params) || !params.length) {
        return false;
    }
    var customDataType;
    for (var i = 0, l = params.length; i < l; i++) {
        if (params[i].datatypeId) {
            return false;
        }
        if (!systemDataTypeMap[params[i].type]) {
            if (customDataType) {
                return false;
            }
            customDataType = params[i].type;
        }
    }
    return !!customDataType;
};

/**
 * check if params is a `ResultData`, this is the most normal case
 * `ResultData` has only one variable field
 * @param  {Array} params - inputs or outputs
 * @return {Boolean} - check result
 */
pro._isResultDataType = function (params) {
    if (!params || !Array.isArray(params) || !params.length) {
        return false;
    }
    if (this._isAnImportedDataType(params)) {
        var dataType = this._types[params[0].datatypeId];
        var attrs = dataType.attrs.filter((attr) => {
            return attr.type === 10000;
        });
        if (attrs.length === 1) {
            return true;
        }
    }
    return false;
};

/**
 * get `variable` field from an imported datatype
 * @param  {Array} params - inputs or outputs
 * @return {Object} - result field
 */
pro._getResultField = function (params) {
    var dataType = this._types[params[0].datatypeId];
    var varField = dataType.attrs.find((attr) => {
        return attr.type === 10000;
    });
    return params.find((param) => {
        return param.name === varField.name;
    });
};

/*
 * get request name
 * @param  {Object} itf - interface object
 * @return {String} - request name
 **/
pro._getReqClassName = function (itf) {
    var name = itf.className || itf.name;
    if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
        return name;
    }
    // name is invalid for class name, using path's camelCase format
    return itf.path.replace(/\/(.)/g, function (match, group1) {
        return group1.toUpperCase();
    }).replace(/\//g, '');
};

/**
 * after output done
 * @private
 * @return {Void}
 */
pro._afterOutput = function () {
    this._beforeDone(this._config);
    this.emit('info', {
        message: 'build success'
    });
    this.emit('done');
};