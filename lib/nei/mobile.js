/*
 * Mobile builder base class
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
let url = require('url');
let Builder = require('./builder');
let _util = require('../util/util');
let logger = require('../util/logger');

class MobileBuilder extends Builder {

    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
        const TPL_ROOT = __dirname + '/mobile/template/';
        super(config, {
            tplRoot: TPL_ROOT
        });
        // if resource is initialized
        this.isResourceInited = false;
        // while diffing, new resource is added
        this.isResourceAdded = false;
        // while diffing, some resource is deleted
        this.isResourceDeleted = false;
        // while diffing, some resource is updated
        this.isResourceUpdated = false;
    }

    /**
     * export model
     * @return {undefined}
     */
    initModConfig() {
        // save config
        let config = this.config;
        let time = new Date();
        this.modConfig = {
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
    }

    /**
     * sort interfaces by it's path
     * @return {undefined}
     */
    sortData() {
        this.data.interfaces.sort(function (a, b) {
            return a.path < b.path ? -1 : 1;
        });
    }

    // diff data map
    getDiffMap() {
        let paramMap = {
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
        let attrMap = {
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
    }

    /**
     * diff two objects
     * @param  {object} oldData - old data object
     * @param  {object} newData - new data object
     * @return {object} returnObj
     */
    diff(oldData, newData) {
        let self = this;
        let diffs = {
            datatypes: {},
            interfaces: {}
        };
        let getTopmostParent = function (parent) {
            if (parent) {
                let p = parent;
                while (p.parent) {
                    p = p.parent;
                }
                return p;
            }
        };
        let getDescPrefix = function (parent) {
            let conf = self.modConfig;
            parent = getTopmostParent(parent);
            let isModel;
            let getFilePath = function (name, isModel) {
                let file;
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
        let getDescExp = function (options, noSuffix) {
            let result = '';
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
        let sepLine = (function () {
            let a = [];
            a.length = 100;
            return a.join('-');
        })();
        let setDiff = function (parent) {
            parent = getTopmostParent(parent);
            if (parent) {
                diffs[parent.key][parent.id] = 1;
                // update htVersion
                if (Array.isArray(newData[parent.key])) {
                    let foundData = newData[parent.key].filter(function (data) {
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
        let diffDesc = [];
        let prevLength = 0;
        let desc;
        let getClassName = function (data, type) {
            if (type === 'interfaces') {
                return self.getReqClassName(data);
            } else {
                return data.name;
            }
        };
        let changedFileNum = 0;
        let checkData = function checkData(oData, nData, cMap, parent) {
            Object.keys(cMap).forEach((key) => {
                let cObj = cMap[key];
                if (cObj.type === 'array') {
                    oData[key].forEach((data, index) => {
                        let foundResults = nData[key].filter(function (o) {
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
                    nData[key].forEach((data) => {
                        let foundResults = oData[key].filter(function (o) {
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
                    Object.keys(oData[key]).forEach((oKey) => {
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
                    Object.keys(nData[key]).forEach((oKey) => {
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
        checkData(oldData, newData, this.getDiffMap());
        diffs.datatypes = Object.keys(diffs.datatypes);
        diffs.interfaces = Object.keys(diffs.interfaces);
        return {
            diffDesc: diffDesc,
            changedNum: changedFileNum,
            diffs: diffs
        }
    }

    /**
     * check the local data, output file with version, output diff detail
     * @return {undefined}
     */
    checkData() {
        let config = this.config;
        let data = this.data;
        data.datatypes = this.dataTypes;
        let diffResult;
        let jsonFile = util.format(
            '%s%s/JSON/nei-latest.json',
            config.outputRoot,
            config.id
        );
        let oldData = _util.file2json(jsonFile);
        let time = _util.getFormatTime('%s-%s-%s-%s-%s-%s-%s');
        let filePrefix = util.format(
            '%s%s/JSON/nei-%s',
            config.outputRoot,
            config.id,
            time
        );
        if (Object.keys(oldData).length) {
            this.isResourceInited = true;
            // copy old version
            data.htVersion = oldData.htVersion;
            Object.keys(this.dataTypes).forEach((dataTypeId) => {
                let version = 0;
                if (oldData.datatypes[dataTypeId]) {
                    version = oldData.datatypes[dataTypeId].htVersion;
                }
                this.dataTypes[dataTypeId].htVersion = version;
            });
            data.interfaces.forEach((itf) => {
                let version = 0;
                let foundOldItfs = oldData.interfaces.filter(function (itff) {
                    return itff.id === itf.id;
                });
                if (foundOldItfs.length === 1) {
                    version = foundOldItfs[0].htVersion;
                }
                itf.htVersion = version;
            });
            diffResult = this.diff(oldData, data);
            let diffTxt = filePrefix + '-diff.txt';
            this.output(diffTxt, diffResult.diffDesc.join('\r\n'));
        } else {
            // set initial htVersion
            data.htVersion = 0;
            Object.keys(this.dataTypes).forEach((dataTypeId) => {
                this.dataTypes[dataTypeId].htVersion = 0;
            });
            data.interfaces.forEach((itf) => {
                itf.htVersion = 0;
            });
        }
        let isChanged = false;
        if (diffResult && diffResult.diffDesc.length) {
            isChanged = true;
            // update htVersion
            data.htVersion += 1;
        }
        // out file with version, backup usage
        let file = filePrefix + '.json';
        let outputContent = JSON.stringify(data, null, '\t');
        this.output(file, outputContent);
        // update latest file
        this.output(jsonFile, outputContent);
        // todo: 要不要排除把没有变化的数据？如果 diff 逻辑有误，导致无法生成变化的文件，这样用户还要等插件更新，整个过程可能比较痛苦。
        if (isChanged) {
            logger.log('debug', {
                message: util.format(
                    'diff result: %s个文件被更改，请查看相应的diff.txt文件',
                    diffResult.changedNum
                )
            });
        }
    }

    // split data type by enum type and common type
    splitDataType() {
        let ret = {
            enums: [],
            models: []
        };
        Object.keys(this.dataTypes).forEach((id) => {
            let type = this.dataTypes[id];
            if (type.format == 1) {
                // for enum type
                ret.enums.push(type);
            } else {
                // for hash map
                let isAbstr = !1;
                type.attrs.forEach((it) => {
                    if (it.type == 10000) {
                        isAbstr = !0;
                    }
                });
                if (!isAbstr) {
                    ret.models.push(id);
                }
            }
        });
        return ret;
    }

    /**
     * check if params is an imported data type
     * @param  {object} params - inputs or outputs
     * @return {boolean}
     */
    isAnImportedDataType(params) {
        if (!params || !Array.isArray(params) || !params.length) {
            return false;
        }
        let datatypeId;
        for (let i = 0, l = params.length; i < l; i++) {
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
    }

    /**
     * check if params has only one custom data type
     * @param  {object} params - inputs or outputs
     * @param  {object} systemDataTypeMap - system data type map
     * @return {boolean}
     */
    hasOnlyOneCustomDataType(params, systemDataTypeMap) {
        if (!params || !Array.isArray(params) || !params.length) {
            return false;
        }
        let customDataType;
        for (let i = 0, l = params.length; i < l; i++) {
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
    }

    /**
     * check if params is a `ResultData`, this is the most normal case
     * `ResultData` has only one variable field
     * @param  {array} params - inputs or outputs
     * @return {boolean} - check result
     */
    isResultDataType(params) {
        if (!params || !Array.isArray(params) || !params.length) {
            return false;
        }
        if (this.isAnImportedDataType(params)) {
            let dataType = this.dataTypes[params[0].datatypeId];
            let attrs = dataType.attrs.filter((attr) => {
                return attr.type === 10000;
            });
            if (attrs.length === 1) {
                return true;
            }
        }
        return false;
    }

    /**
     * get `variable` field from an imported datatype
     * @param  {array} params - inputs or outputs
     * @return {object} - result field
     */
    getResultField(params) {
        let dataType = this.dataTypes[params[0].datatypeId];
        let varField = dataType.attrs.find((attr) => {
            return attr.type === 10000;
        });
        return params.find((param) => {
            return param.name === varField.name;
        });
    }

    /**
     * get request name
     * @param  {object} itf - interface object
     * @return {String} - request name
     */
    getReqClassName(itf) {
        let name = itf.className || itf.name;
        if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
            return name;
        }
        // name is invalid for class name, using path's camelCase format
        return itf.path.replace(/\/(.)/g, (match, group1) => {
            return group1.toUpperCase();
        }).replace(/\//g, '');
    }

    /**
     * after output done
     * @return {undefined}
     */
    afterOutput() {
        this.beforeDone();
        logger.log('info', {
            message: 'build success'
        });
    }

}

module.exports = MobileBuilder;
