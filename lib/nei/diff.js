/*
 * Abstract NEI Builder
 * @author   huntbao
 */

'use strict';
let util = require('util');
let querystring = require('querystring');
let EventEmitter = require('events');
let _io = require('../util/io');
let _fs = require('../util/file');
let _path = require('../util/path');
let _util = require('../util/util');
let logger = require('../util/logger');

class Diff extends EventEmitter {
    /**
     * @param  {object} config - 配置参数
     * @param  {object} ds - nei 数据源
     */
    constructor(config, ds) {
        super();
        this.config = config;
        this.ds = ds;
        // nei 资源是否已被初始化过
        this.isResourceInited = false;
        // diff 的时候, nei 资源有增加
        this.isResourceAdded = false;
        // diff 的时候, nei 资源有删除
        this.isResourceDeleted = false;
        // diff 的时候, nei 资源有更新
        this.isResourceUpdated = false;
        this.diffJSONData();
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
                    'params.inputs': Object.assign({}, paramMap, {
                        name: '输入参数'
                    }),
                    'params.outputs': Object.assign({}, paramMap, {
                        name: '输出参数'
                    }),
                    'params.reqHeaders': Object.assign({}, paramMap, {
                        name: '请求头参数'
                    }),
                    'params.resHeaders': Object.assign({}, paramMap, {
                        name: '响应头参数'
                    })
                }
            },
            datatypes: {
                type: 'object',
                name: '数据类型',
                values: {
                    name: '名称',
                    format: '类型',
                    params: Object.assign({}, attrMap, {
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
     * @return {object} diff detail object
     */
    diff(oldData, newData) {
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
        let getDescPrefix = (parent) => {
            parent = getTopmostParent(parent);
            let isModel;
            isModel = parent.key === 'datatypes';
            return util.format(
                '%s%s：',
                isModel ? '模型' : '接口'
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
        let sepLine = (() => {
            let a = [];
            a.length = 100;
            return a.join('-');
        })();
        let setDiff = (parent) => {
            parent = getTopmostParent(parent);
            if (parent) {
                diffs[parent.key][parent.id] = 1;
                // update version
                if (Array.isArray(newData[parent.key])) {
                    let foundData = newData[parent.key].filter((data) => {
                        return data.id === parent.id;
                    });
                    if (foundData.length === 1) {
                        foundData[0].version += 1;
                    }
                } else {
                    newData[parent.key][parent.id].version += 1;
                }
            }
        };
        let diffDesc = [];
        let prevLength = 0;
        let desc;
        let getClassName = (data, type) => {
            if (type === 'interfaces') {
                return data.className;
            } else {
                return data.name;
            }
        };
        let changedFileNum = 0;
        let checkData = (oData, nData, cMap, parent) => {
            Object.keys(cMap).forEach((key) => {
                let cObj = cMap[key];
                if (cObj.type === 'array') {
                    oData[key].forEach((data, index) => {
                        let foundResults = nData[key].filter((o) => {
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
                            this.isResourceDeleted = true;
                        }
                    });
                    // 再判断新增的情况
                    nData[key].forEach((data) => {
                        let foundResults = oData[key].filter((o) => {
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
                            this.isResourceAdded = true;
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
                            this.isResourceDeleted = true;
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
                            this.isResourceAdded = true;
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
                        this.isResourceUpdated = true;
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
     * check the local json data, output file with version, output diff detail
     */
    diffJSONData() {
        let config = this.config;
        let data = this.ds;
        let diffResult;
        let jsonFile = `${this.config.outputRoot}nei.${this.config.pid}/json/nei-latest.json`;
        let oldData = _util.file2json(jsonFile);
        let time = _util.getFormatTime('%s-%s-%s-%s-%s-%s-%s');
        let filePrefix = `${this.config.outputRoot}nei.${this.config.pid}/json/nei-${time}`;
        if (Object.keys(oldData).length) {
            this.isResourceInited = true;
            // 复制旧的版本号
            data.version = oldData.version;
            Object.keys(data.datatypes).forEach((dataTypeId) => {
                let version = 0;
                if (oldData.datatypes[dataTypeId]) {
                    version = oldData.datatypes[dataTypeId].version;
                }
                data.datatypes[dataTypeId].version = version;
            });
            data.interfaces.forEach((itf) => {
                let version = 0;
                let foundOldItfs = oldData.interfaces.filter((itff) => {
                    return itff.id === itf.id;
                });
                if (foundOldItfs.length === 1) {
                    version = foundOldItfs[0].version;
                }
                itf.version = version;
            });
            diffResult = this.diff(oldData, data);
            let diffTxt = filePrefix + '-diff.txt';
            this.output(diffTxt, diffResult.diffDesc.join('\r\n'));
        } else {
            // 设置初始版本号
            data.version = 0;
            Object.keys(data.datatypes).forEach((dataTypeId) => {
                data.datatypes[dataTypeId].version = 0;
            });
            data.interfaces.forEach((itf) => {
                itf.version = 0;
            });
        }
        let isChanged = false;
        if (diffResult && diffResult.diffDesc.length) {
            isChanged = true;
            // 更新版本号
            data.version += 1;
        }
        let file = filePrefix + '.json';
        let outputContent = JSON.stringify(data, null, '\t');
        this.output(file, outputContent);
        // 更新 latest 文件
        this.output(jsonFile, outputContent);
        // todo: 要不要排除没有变化的数据？如果 diff 逻辑有误，导致无法生成变化的文件，这样用户还要等插件更新，整个过程可能比较痛苦。
        if (isChanged) {
            logger.log('debug', {
                message: `diff result: ${diffResult.changedNum}个文件被更改，请查看相应的diff.txt文件`
            });
        }
    }

    /**
     * 同步写文件
     * @param  {string} file - 文件完整路径, 包括文件名
     * @param  {string} content - 文件内容
     */
    output(file, content) {
        _io.outputSync(file, content);
        logger.log('debug', {
            data: [file],
            message: '输出: %s'
        });
    }
}

module.exports = Diff;

