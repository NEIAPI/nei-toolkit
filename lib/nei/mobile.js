/*
 * Mobile Builder
 * @module   nei/mobile
 * @author   genify(caijf@corp.netease.com)
 */
var path = require('path'),
    util = require('util'),
    url = require('url'),
    _util = require('../util/util.js');
// template root
var TPL_ROOT = __dirname + '/mobile/template/';
// mobile build
var Mobile = module.exports
    = require('../util/klass.js').create();
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
 * build project
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.webRoot - absolute path of web root
 * @param  {String}  config.viewRoot - absolute path of server template root
 * @param  {Object}  options - build options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._build = function (config, options, data) {
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
pro.model = function (config) {
    // check language
    var func = {
        oc: this._modelOC,
        java: this._modelJava
    }[
        config.lang
        ];
    if (!func) {
        this.emit('error', {
            data: [config.lang],
            message: 'not supported language %s'
        });
        this.emit('done');
        return;
    }
    // save config
    var time = new Date();
    this._modConf = {
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
    // load config from nei
    this._loadConfig(func);
};
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
        var conf = self._modConf;
        parent = getTopmostParent(parent);
        var str;
        var isModel = false;
        var getFilePath = function (name, isModel) {
            if (conf.lang === 'java') {
                return (isModel ? 'Models/' : 'HttpTasks/') + conf.aPkg.replace(/\./g, '/') + '/' + name + '.java';
            } else if (conf.lang === 'oc') {
                return (isModel ? 'Models/' : 'Requests/') + name + '.h';
            }
        };
        if (parent.key === 'interfaces') {
            str = '接口';
        } else {
            isModel = true;
            str = '模型';
        }
        return str + '文件' + getFilePath(parent.dataName, isModel) + '：';
    };
    var getDescExp = function (options, noSuffix) {
        var result = '';
        if (!options) {
            return result;
        }
        if (options.prefix) {
            result += options.prefix;
        }
        result += (typeof(options.index) === 'number' ? ('第' + options.index + '个') : '') + options.name + '(id:' + options.id + '' + (options.dataName ? (', name:"' + options.dataName + '"') : '') + ')';
        return result + (noSuffix ? '' : '的');
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
        }
    };
    var diffDesc = [];
    var prevLength = 0;
    var checkData = function (oData, nData, cMap, parent) {
        if (diffDesc.length !== prevLength) {
            diffDesc.push(sepLine);
            prevLength = diffDesc.length;
        }
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
                            key: key,
                            name: cObj.name,
                            index: index + 1,
                            prefix: getDescExp(parent),
                            parent: parent
                        });
                    } else {
                        diffDesc.push(getDescPrefix(parent) + getDescExp(parent) + '第' + (index + 1) + '个' + cObj.name + '(id: ' + data.id + ', name: "' + data.name + '")' + '已被删除');
                    }
                });
                // 再判断新增的情况
                nData[key].forEach(function (data, index) {
                    var foundResults = oData[key].filter(function (o) {
                        return o.id === data.id;
                    });
                    if (foundResults.length === 0) {
                        setDiff(parent);
                        diffDesc.push(getDescPrefix(parent) + getDescExp(parent, true) + '新增了' + cObj.name + '(id: ' + data.id + ', name: "' + data.name + '")');
                    }
                });
            } else if (cObj.type === 'object') {
                Object.keys(oData[key]).forEach(function (oKey) {
                    if (nData[key][oKey]) {
                        checkData(oData[key][oKey], nData[key][oKey], cObj.values, {
                            id: oKey,
                            key: key,
                            dataName: oData[key][oKey].name,
                            name: cObj.name,
                            prefix: getDescExp(parent),
                            parent: parent
                        });
                    } else {
                        setDiff(parent);
                        diffDesc.push(getDescPrefix(parent) + cObj.name + oKey + '已被删除');
                    }
                });
                // 再判断新增的情况
                Object.keys(nData[key]).forEach(function (oKey) {
                    if (!oData[key].hasOwnProperty([oKey])) {
                        diffDesc.push(getDescPrefix(parent) + '新增了' + cObj.name + oKey);
                    }
                });
            } else {
                if (oData[key] !== nData[key]) {
                    setDiff(parent);
                    diffDesc.push(getDescPrefix(parent) + getDescExp(parent) + '"' + cObj + '(' + key + ')"' + '已更改');
                }
            }
        });
    };
    checkData(oldData, newData, this._diffMap);
    diffs.datatypes = Object.keys(diffs.datatypes);
    diffs.interfaces = Object.keys(diffs.interfaces);
    return {
        diffDesc: diffDesc,
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
    var jsonFile = config.proRoot + 'JSON/nei-' + config.id + '-latest.json';
    newData.datatypes = this._types;
    this._get(jsonFile, function (fileData) {
        var time = _util.getFormatTime('%s-%s-%s-%s-%s-%s-%s');
        var filePrefix = config.proRoot + 'JSON/nei-' + config.id + '-' + time;
        try {
            var content = fileData.value;
            var json = JSON.parse(content);
            diffResult = self._diff(json, newData);
            var diffTxt = filePrefix + '-diff.txt';
            self._output(diffTxt, diffResult.diffDesc.join('\r\n'));
        } catch (err) {
            self.emit('error', {
                message: err
            });
        }
        // out file with version, backup usage
        var file = filePrefix + '.json';
        var outputContent = JSON.stringify(newData, null, '\t');
        self._output(file, outputContent);
        // update latest file
        self._output(jsonFile, outputContent);
        // todo: 要不要排除把没有变化的数据？貌似值为中文的时候会有乱码问题，导致 diff 结果异常
        callback(newData);
        if (diffResult && diffResult.diffDesc.length) {
            self.emit('debug', {
                message: 'diff result: ' + (diffResult.diffDesc.length/2) + '个文件被更改，详细信息请查看相应的diff.txt文件'
            });
        }
    });
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
 * judge if params is an imported data type
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
 * judge if params has only one custom data type
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
 * judge if params is a `ResultData`, this is the most normal case
 * `ResultData` has 3 fields: code, message, result
 * @param  {Object} params - inputs or outputs
 * @return {Boolean}
 */
pro._isResultDataType = function (params) {
    if (!params || !Array.isArray(params) || !params.length) {
        return false;
    }
    var first = params[0];
    return !!(first.datatypeId && first.datatypeName === 'ResultData');

};
/**
 * get result field from params
 * @param  {Object} params - inputs or outputs
 * @return {Object} - result field
 */
pro._getResultField = function (params) {
    // es6 has `Array.find` method
    var results = params.filter(function (param) {
        return param.name === 'result';
    });
    if (results.length === 1) {
        return results[0];
    }
    this.emit('error', {
        message: 'Build request: output is "ResultData", but it has no "result" field'
    });
};
/*
* get request name
 * @param  {Object} itf - interface object
 * @return {String} - request name
**/
pro._getReqName = function (itf) {
    var name = itf.className || itf.name;
    if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
        return name;
    }
    // name is invalid for class name, using path's camelCase format
    return itf.path.replace(/\/(.)/g, function (match, group1) {
        return group1.toUpperCase();
    });
};
// map data type of objective-c
pro._dataTypeMapOC = {
    10000: {typeName: 'id', refName: 'strong'},
    10001: {typeName: 'NSString', refName: 'copy'},
    10002: {typeName: 'CGFloat', arrName: 'NSNumber', refName: 'assign', noStar: !0},
    10003: {typeName: 'BOOL', arrName: 'NSNumber', refName: 'assign', noStar: !0}
};
/**
 * get prop objective-c
 * @param  {Object} type - data type
 * @param  {String} attr - attribute
 * @return {Object} prop
 */
pro._getPropOC = function (type, attr) {
    var conf = this._dataTypeMapOC[attr.type];
    if (!conf) {
        var it = this._types[attr.type];
        conf = {
            refName: 'strong',
            typeName: this._modConf.prefix + it.name
        };
        // check enum type
        if (it.format != 1) {
            // for Klass type
            type.klses[attr.name] = it.name;
        } else {
            // for enum type
            conf = this._dataTypeMapOC['10001'];
        }
        if (!type.hasEnum) {
            type.hasEnum = it.format == 1;
        }
    }
    var prop = _util.merge(attr, conf);
    // check for Array
    if (prop.isArray == 1) {
        prop.noStar = !1;
        prop.refName = 'strong';
        prop.typeName = 'NSArray<' + (prop.arrName || prop.typeName) + ' *>';
    }
    return prop;
};
/**
 * format objective-c property
 * @param  {Object} type - data type
 * @param  {String} conf - config object
 * @return {Object} type
 */
pro._formatPropOC = function (type, conf) {
    // check properties
    if (!type.props) {
        type.props = [];
        type.klses = {};
        // format properties
        type.attrs.forEach(
            function (attr) {
                type.props.push(this._getPropOC(type, attr));
            }, this
        );
        // for dictStr
        var arr = [];
        Object.keys(type.klses).forEach(function (name) {
            var it = type.klses[name];
            arr.push(util.format('@"%s" : @"%s%s"', name, conf.prefix, it));
        });
        type.dictStr = arr.join(', ');
        // for baseStr
        arr = [];
        type.props.forEach(function (it) {
            if (!type.klses[it.name]) {
                arr.push(util.format('@"%s"', it.name));
            }
        });
        type.baseStr = arr.join(', ');
    }
    return type;
};
/**
 * generator objective-c model source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._exportModelOC = function (config, options, data) {
    var root = config.proRoot + 'Models/',
        conf = this._modConf || {};
    // split data type
    var ret = this._splitDataType();
    // build enum type
    ret.enums.forEach(function (it) {
        it.pairs = [];
        it.attrs.forEach(function (attr) {
            it.pairs.push({
                key: attr.vkey,
                value: attr.name,
                desc: attr.description
            });
        });
    });
    if (ret.enums.length > 0) {
        ['m', 'h'].forEach(
            function (ext) {
                var file = root + conf.prefix + 'ModelEnums.' + ext,
                    content = this._mergeTemplate(
                        TPL_ROOT + 'oc/enum.' + ext, {
                            conf: conf,
                            enums: ret.enums
                        }
                    );
                this._output(file, content);
            }, this
        );
    }
    // build data type model
    var arr = [];
    ret.models.forEach(
        function (id) {
            // ignore system type
            if (!!this._dataTypeMapOC[id]) {
                return;
            }
            // check type
            var type = this._formatPropOC(this._types[id], conf),
                prefix = root + conf.prefix + type.name + '.';
            arr.push(type.name);
            // output xx.m and xx.h
            ['m', 'h'].forEach(
                function (ext) {
                    var file = prefix + ext,
                        content = this._mergeTemplate(
                            TPL_ROOT + 'oc/model.' + ext, {
                                conf: conf,
                                type: type
                            }
                        );
                    this._output(file, content);
                }, this
            );
        }, this
    );
    // output models.h
    arr.sort();
    var file = root + conf.prefix + conf.mheader + '.h',
        content = this._mergeTemplate(
            TPL_ROOT + 'oc/models.h', {
                conf: conf,
                list: arr
            }
        );
    this._output(file, content);
};
/**
 * generator objective-c request source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._exportRequestOC = function (config, options, data) {
    var self = this;
    var root = config.proRoot + 'Requests/';
    var conf = this._modConf || {};
    var lowerCaseFirst = function (name) {
        return name.charAt(0).toLowerCase() + name.slice(1);
    };
    var getReqRes = function (outputs) {
        if (self._isResultDataType(outputs)) {
            var resultOutput = self._getResultField(outputs) || {};
            return {
                model: resultOutput.typeName,
                name: 'result'
            }
        }
        if (self._isAnImportedDataType(outputs)) {
            return {
                model: outputs[0].datatypeName,
                name: null
            }
        }
        if (outputs.length > 1 && self._hasOnlyOneCustomDataType(outputs, self._dataTypeMapOC)) {
            var customDataType;
            outputs.forEach(function (output) {
                if (!self._dataTypeMapOC[output.type]) {
                    customDataType = output;
                }
            });
            return {
                model: customDataType.typeName,
                name: customDataType.name
            }
        }
        if (outputs.length === 1) {
            var firstOutput = outputs[0];
            if (!self._dataTypeMapOC[firstOutput.type]) {
                return {
                    model: firstOutput.typeName,
                    name: firstOutput.name
                }
            }
        }
    };
    var getReqInfo = function (inputs) {
        var dataTypes = [];
        var models = {};
        var autoAddedName;
        var setDataTypeAndModel = function (input, dataTypeId) {
            var type = self._types[dataTypeId];
            var prop = self._getPropOC(type, input);
            type.klses && Object.keys(type.klses).forEach(function (key) {
                models[type.klses[key]] = 1;
            });
            dataTypes.push(prop);
        };
        if (self._isAnImportedDataType(inputs)) {
            var first = inputs[0];
            autoAddedName = lowerCaseFirst(first.datatypeName);
            setDataTypeAndModel({
                name: autoAddedName,
                type: first.datatypeId,
                description: first.datatypeName
            }, first.datatypeId);
        } else {
            inputs.forEach(function (input) {
                setDataTypeAndModel(input, input.type);
            });
        }

        return {
            dataTypes: dataTypes,
            models: Object.keys(models).sort(),
            autoAddedName: autoAddedName
        }
    };
    var getReqHeaders = function (headers) {
        var constHeaders = [];
        var varHeaders = [];
        headers.forEach(function (header) {
            // variable header
            if (header.defaultValue === '') {
                varHeaders.push({
                    varName: lowerCaseFirst(header.name).replace(/-(.)/g, function (match, group1) {
                        return group1.toUpperCase();
                    }),
                    key: header.name,
                    desc: header.description
                });
            } else {
                constHeaders.push({
                    key: header.name,
                    value: header.defaultValue,
                    desc: header.description
                });
            }
        });
        return {
            constHeaders: constHeaders,
            varHeaders: varHeaders
        }
    };
    var reqs = [];
    var req;
    // build requests
    data.interfaces.forEach(
        function (itf) {
            var res = getReqRes(itf.outputs) || {};
            var reqInfo = getReqInfo(itf.inputs);
            var headers = getReqHeaders(itf.headers);
            req = {
                name: this._getReqName(itf),
                method: this._parseReqMethod(itf.method),
                url: itf.path,
                description: itf.description,
                reqDataTypes: reqInfo.dataTypes,
                reqModels: reqInfo.models,
                reqAutoAddedName: reqInfo.autoAddedName,
                reqConstHeaders: headers.constHeaders,
                reqVarHeaders: headers.varHeaders,
                resModel: res.model,
                resName: res.name
            };
            var prefix = root + conf.prefix + req.name + '.';
            ['h', 'm'].forEach(
                function (ext) {
                    var file = prefix + ext;
                    var content = this._mergeTemplate(
                        TPL_ROOT + 'oc/request.' + ext, {
                            conf: conf,
                            req: req
                        }
                    );
                    this._output(file, content);
                }, this
            );
            reqs.push(req.name)
        }, this
    );
    // output requests.h
    reqs.sort();
    var file = root + conf.prefix + conf.rheader + '.h';
    var content = this._mergeTemplate(
        TPL_ROOT + 'oc/requests.h', {
            conf: conf,
            list: reqs
        }
    );
    this._output(file, content);
};
/**
 * generator objective-c source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._modelOC = function (config, options, data) {
    this._checkData(data, config, function (data) {
        this._exportModelOC(config, options, data);
        this._exportRequestOC(config, options, data);
    }.bind(this));
};
// map data type of java
pro._dataTypeMapJava = {
    10000: {typeName: 'Object'},
    10001: {typeName: 'String'},
    10002: {typeName: 'double', listTypeName: 'Double'},
    10003: {typeName: 'boolean', listTypeName: 'Boolean'}
};
/**
 * get prop java
 * @param  {Object} type - data type
 * @param  {String} attr - attribute
 * @return {Object} prop
 */
pro._getPropJava = function (attr) {
    var conf = this._dataTypeMapJava[attr.type];
    if (!conf) {
        var it = this._types[attr.type];
        conf = {
            typeName: it.name
        };
        // check enum type
        if (it.format === 1) {
            // for enum type
            conf = this._dataTypeMapJava['10001'];
        }
    }
    var prop = _util.merge(attr, conf);
    // check for Array
    if (prop.isArray == 1) {
        prop.typeName = 'List<' + (prop.listTypeName || prop.typeName) + '>';
    }
    prop.capName = prop.name.replace(/./, function ($1) {
        return $1.toUpperCase();
    });
    return prop;
};
/**
 * format java data type's property
 * @param  {Object} type - data type
 * @param  {String} conf - config object
 * @return {Object} type
 */
pro._formatPropJava = function (type, conf) {
    // check properties
    if (!type.props) {
        type.props = [];
        type.pkgs = {};
        // format properties
        type.attrs.forEach(function (attr) {
            if (attr.isArray) {
                type.pkgs['java.util.List'] = 1;
            }
            type.props.push(this._getPropJava(attr));
        }, this);
    }
    return type;
};
/**
 * generator java model source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._exportModelJava = function (config, options, data) {
    var root = config.proRoot + 'Models/';
    var conf = this._modConf || {};
    // split data type
    var ret = this._splitDataType();
    var getFileName = function (typeName) {
        return (root + conf.aPkg + '/' + conf.mPkg).replace(/\./g, '/') + '/' + typeName + '.java';
    };
    // build enum type
    ret.enums.forEach(function (type) {
        var file = getFileName(type.name);
        var content = this._mergeTemplate(
            TPL_ROOT + 'java/enum.java', {
                conf: conf,
                type: type
            }
        );
        this._output(file, content);
    }, this);
    // build data type model
    ret.models.forEach(function (id) {
        // ignore system type
        if (!!this._dataTypeMapJava[id]) {
            return;
        }
        var type = this._formatPropJava(this._types[id], conf);
        var file = getFileName(type.name);
        var content = this._mergeTemplate(
            TPL_ROOT + 'java/model.java', {
                conf: conf,
                type: type
            }
        );
        this._output(file, content);
    }, this);
};

/**
 * generator java httptask source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._exportRequestJava = function (config, options, data) {
    var self = this;
    var root = config.proRoot + 'HttpTasks/';
    var conf = self._modConf || {};
    var pkgs = {};
    var getFileName = function (typeName) {
        return (root + conf.aPkg + '/' + conf.mPkg).replace(/\./g, '/') + '/' + typeName + '.java';
    };
    var getWhiteSpace = function (name) {
        var wsArr = [];
        wsArr.length = name.length + 17;
        return wsArr.join(' ');
    };
    var getInputs = function (itf) {
        var inputs = [];
        if (self._isAnImportedDataType(itf.inputs)) {
            var dataTypeName = itf.inputs[0].datatypeName;
            inputs.push({
                typeName: dataTypeName,
                name: dataTypeName.replace(/./, function ($1) {
                    return $1.toLowerCase();
                })
            });
            pkgs[conf.aPkg + '.' + conf.mPkg + '.' + dataTypeName] = 1;
        } else {
            itf.inputs.forEach(function (input, index) {
                var prop = self._getPropJava(input);
                if (index !== 0) {
                    prop.whiteSpace = getWhiteSpace(self._getReqName(itf));
                }
                inputs.push(prop);
                // if it is not system type, import model package
                if (!self._dataTypeMapJava[input.type]) {
                    pkgs[conf.aPkg + '.' + conf.mPkg + '.' + input.typeName] = 1;
                }
            });
        }
        return inputs;
    };
    var getParams = function (itf) {
        var method = self._parseReqMethod(itf.method);
        var params = [];
        var inputContainer = /^(GET|HEAD)$/.test(method) ? 'mQueryParamsMap' : 'mBodyMap';
        var jsonObjectStr = 'com.alibaba.fastjson.JSONObject';
        var jsonArrayStr = 'com.alibaba.fastjson.JSONArray';
        var getParamValueExp = function (param) {
            if (param.isArray) {
                pkgs[jsonArrayStr] = 1;
                if (!self._dataTypeMapJava[param.type]) {
                    pkgs[conf.aPkg + '.' + conf.mPkg + '.' + param.typeName] = 1;
                }
                return 'JSONArray.toJSONString(' + param.name + ')';
            } else if (self._dataTypeMapJava[param.type]) {
                switch (param.type) {
                    case 10002:
                    case 10003:
                        pkgs[jsonObjectStr] = 1;
                        return self._dataTypeMapJava[param.type].listTypeName + '.toString(' + param.name + ')';
                    default:
                        return param.name;
                }
            } else {
                pkgs[conf.aPkg + '.' + conf.mPkg + '.' + param.typeName] = 1;
                return 'JSONObject.toJSONString(' + param.name + ')';
            }
        };
        itf.headers.forEach(function (header) {
            params.push({
                container: 'mHeaderMap',
                key: header.name,
                desc: header.description,
                valueExp: '"' + header.defaultValue + '"' // header's value is always `string`
            });
        });
        if (self._isAnImportedDataType(itf.inputs)) {
            var input = self._types[itf.inputs[0].datatypeId];
            params.push({
                container: inputContainer,
                key: input.name,
                desc: input.description,
                valueExp: inputContainer === 'mBodyMap' ? input.name : getParamValueExp(input)
            });
            pkgs[conf.aPkg + '.' + conf.mPkg + '.' + input.name] = 1;
        } else {
            itf.inputs.forEach(function (input) {
                params.push({
                    container: inputContainer,
                    key: input.name,
                    desc: input.description,
                    valueExp: inputContainer === 'mBodyMap' ? input.name : getParamValueExp(input)
                });
            });
        }
        return params;
    };
    var getOutputModel = function (outputs) {
        var getModel = function (output) {
            var type = self._dataTypeMapJava[output.type];
            if (!type) {
                // is custom data type
                pkgs[conf.aPkg + '.' + conf.mPkg + '.' + output.typeName] = 1;
                type = {
                    typeName: output.typeName
                }
            }
            return (type.listTypeName || type.typeName) + '.class';
        };
        if (self._isResultDataType(outputs)) {
            var result = self._getResultField(outputs);
            if (result) {
                return getModel(result);
            }
        }
        if (self._isAnImportedDataType(outputs)) {
            var typeName = outputs[0].datatypeName;
            pkgs[conf.aPkg + '.' + conf.mPkg + '.' + typeName] = 1;
            return typeName + '.class';
        }
        if (outputs.length === 1) {
            return getModel(outputs[0]);
        }
        if (outputs.length > 1) {
            return 'Object.class';
        }
        return 'null';
    };
    var baseReqPkg;
    var baseReqClass = (function () {
        if (conf.base.indexOf('.') !== -1) {
            // full path
            baseReqPkg = conf.base;
        } else {
            baseReqPkg = 'com.netease.hthttp' + '.' + conf.base
        }
        var paths = conf.base.split('.');
        return paths[paths.length - 1];
    })();
    // build requests
    data.interfaces.forEach(function (itf) {
        pkgs = {
            'com.netease.hthttp.HttpMethod': 1 // default imported package
        };
        pkgs[baseReqPkg] = 1;
        var method = this._parseReqMethod(itf.method);
        var req = {
            baseClass: baseReqClass,
            inputs: getInputs(itf),
            name: this._getReqName(itf) + 'HttpTask',
            method: method,
            path: itf.path,
            desc: itf.description,
            outputModel: getOutputModel(itf.outputs),
            hasHost: !!url.parse(itf.path).host
        };
        var tpl = TPL_ROOT + 'java/request.java';
        if (method === 'PUT') {
            pkgs['com.netease.hthttp.multipart.fileupload.http.BaseFileUploadHttpRequestTask'] = 1;
            pkgs['java.io.File'] = 1;
            pkgs['java.util.HashMap'] = 1;
            // put request is file upload
            tpl = TPL_ROOT + 'java/request.put.java';
            req.mBoundary = (conf.aPkg.replace(/\./g, '_') + '_upload_file_boundary').toUpperCase();
        } else {
            req.params = getParams(itf);
        }
        req.pkgs = Object.keys(pkgs).sort();
        var file = getFileName(req.name);
        var content = this._mergeTemplate(tpl, {
            conf: conf,
            req: req
        });
        this._output(file, content);
    }, this);
};

/**
 * generator Java source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._modelJava = function (config, options, data) {
    this._checkData(data, config, function (data) {
        this._exportModelJava(config, options, data);
        this._exportRequestJava(config, options, data);
    }.bind(this));
};