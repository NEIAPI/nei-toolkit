/*
 * Abstract NEI Builder
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */

'use strict';

let vm = require('vm');
let util = require('util');
let querystring = require('querystring');
let swig = require('swig');
let EventEmitter = require('events');
let _io = require('../util/io');
let _fs = require('../util/file');
let _path = require('../util/path');
let _util = require('../util/util');
let logger = require('../util/logger');

const METHODS_LIST = ['POST', 'GET', 'PUT', 'DELETE', 'HEAD'];

class Builder extends EventEmitter {
    /**
     * class constructor
     * @param  {object} config -
     * @param  {object} [options] - build options
     * @return {undefined}
     */
    constructor(config, options) {
        super();
        this.config = config;
        this.options = Object.assign({
            tplRoot: _path.absolute(
                './template/', __dirname + '/'
            )
        }, options, {
            overwrite: !!config.overwrite,
            checkTime: parseInt(config.updateTime, 10) || 0
        });
        // if nei resource is initialized
        this.isResourceInited = false;
        // while diffing, new nei resource is added
        this.isResourceAdded = false;
        // while diffing, some nei resource is deleted
        this.isResourceDeleted = false;
        // while diffing, some nei resource is updated
        this.isResourceUpdated = false;
        this.cnfRoot = `${config.outputRoot}nei.${config.id}/`;
        this.templates = {};
        this.compileTemplate();
        this.extendConfig();
    }

    /**
     * extend config object if necessary
     * @return {undefined}
     */
    extendConfig() {
        // do something in subclass
    }

    /**
     * convert path to filename
     * @param  {string} path - template file path
     * @param  {string} root - view root path
     * @return {string} file name
     */
    parseFileName(path, root) {
        let file = _path.absoluteAltRoot(path, root, root);
        return file.replace(root, '').replace(/\.[^\/]*?$/, '');
    }

    /**
     * convert method value to name
     * @param  {number} value - method value
     * @return {string} method name
     */
    getReqMethod(value) {
        return METHODS_LIST[value] || 'GET';
    }

    /**
     * parse template under template dir
     * @return {undefined}
     */
    compileTemplate() {
        if (!this.options.tplRoot) return;
        _fs.lsfile(this.options.tplRoot, (name, file) => {
            logger.log('debug', {
                data: [file],
                message: 'complie template %s'
            });
            this.templates[file] = swig.compileFile(file, {autoescape: !1});
        });
    }

    /**
     * merge template with data
     * @param  {string} file - key of template
     * @param  {object} [data] - template data
     * @return {string} content after merge data
     */
    mergeTemplate(file, data) {
        file = _path.normalize(file);
        let func = (this.templates || {})[file];
        if (func) {
            return func(data || {});
        }
        logger.log('warn', {
            message: `template [${file}] not exist`
        });
        return '';
    }

    /**
     * format data from nei
     * @return {undefined}
     */
    formatData() {
        let data = this.data;
        // format project information
        if (!data.project) {
            let id = this.config.id;
            data.project = {
                id: id,
                name: 'NEI-PROJECT-' + id,
                group: 'NEI-GROUP-' + id
            };
        }
        // format data types
        this.dataTypes = {};
        (data.datatypes || []).forEach((it)=> {
            it.attrs = [];
            this.dataTypes[it.id] = it;
        });
        delete data.datatypes;
        // format type attributes
        (data.attributes || data.attributeList || []).forEach((it) => {
            let type = this.dataTypes[it.parentId];
            if (!type) {
                return;
            }
            type.attrs.push(it);
        });
        delete data.attributes;
        delete data.attributeList;
        // delete templates which are not referenced by pages
        let templates = Object.create(null);
        data.pages.forEach((page) => {
            page.templates.forEach((templateId) => {
                templates[templateId] = 1;
            });
        });
        data.templates = data.templates.filter((template) => {
            return templates[template.id];
        });
    }

    /**
     * generate mock data for data type
     * @param  {object}  config - type config object
     * @param  {object} [test] - test for circular reference check
     * @return {object|array} - mock data
     */
    genMockData(config, test) {
        let str2json = (code) => {
            if (!code) {
                return;
            }
            try {
                // try json parse
                return JSON.parse(code);
            } catch (ex) {
                try {
                    // try eval
                    let sandbox = {};
                    vm.createContext(sandbox);
                    vm.runInContext(util.format('ret = %s', code || ''), sandbox);
                    return sandbox.ret;
                } catch (e) {
                    // ignore
                }
            }
        };
        let fmap = {
            // Variable
            10000: function (config) {
                let ret = str2json(config.description);
                if (ret != null) {
                    return ret;
                }
                return this.genMockData({
                    type: _util.randNext([10001, 10002, 10003])
                });
            },
            // string
            10001: function (config) {
                return config.defaultValue || _util.randString(_util.rand(5, 20));
            },
            // Number
            10002: function (config) {
                if (config.defaultValue) {
                    let result = Number(config.defaultValue);
                    if (isNaN(result)) {
                        return _util.increment();
                    }
                    return result;
                }
                return _util.increment();
            },
            // Boolean
            10003: function (config) {
                if (config.defaultValue) {
                    return config.defaultValue === 'true';
                }
                return _util.randNext([!0, !1]);
            }
        };
        let type = config.type;
        let isArray = config.isArray === 1;
        // for system type
        let ret;
        let func = fmap[type];
        if (!!func) {
            ret = func.call(this, config);
        }
        if (ret == null) {
            let dataType = this.dataTypes[type];
            let attrs = dataType.attrs || [];
            if (dataType.format == 2) {
                // for array type
                let stp = {
                    isArray: 1,
                    type: dataType.subtype
                };
                return this.genMockData(stp, test);
            } else if (dataType.format == 1) {
                // 枚举类型
                if (config.defaultValue) {
                    // 先取默认值
                    ret = config.defaultValue;
                } else {
                    // 随机取个值
                    dataType = _util.randNext(attrs) || {};
                    ret = dataType.name || '';
                }
                // 尝试转成数值型
                if (parseInt(ret).toString() === ret) {
                    ret = parseInt(ret);
                }
            } else {
                // for hash map type
                ret = {};
                // for circular reference check
                if (!!test) {
                    test[type] = !0;
                }
                attrs.forEach((it)=> {
                    let dat = null;
                    // for circular reference check
                    test = test || {};
                    if (!test[it.type]) {
                        dat = this.genMockData(it, test);
                        delete test[it.type];
                    } else {
                        logger.log('error', {
                            data: [it.type, this.dataTypes[it.type].name, type, dataType.name],
                            message: 'circular reference %s:%s in %s:%s'
                        });
                    }
                    ret[it.name] = dat;
                });
            }
        }
        // generate array
        if (isArray) {
            ret = [ret];
            for (let i = _util.rand(5, 10), it; i >= 0; i--) {
                it = _util.merge(config, {
                    isArray: 0
                });
                ret.push(this.genMockData(it, {}));
            }
        }
        return ret;
    }

    /**
     * build template mock data
     * @param  {array} list - page template list
     * @param  {object} config - config object
     * @return {undefined}
     */
    buildTemplateMock(list, config) {
        (list || []).forEach((it)=> {
            // check mock file
            let params = it.parameters;
            let mock = it.mock;
            if (!params || !params.length) {
                return;
            }
            let file = `${config.mockRoot}${mock}.json`;
            // check overwrite exist file
            let existed = _fs.exist(file);
            if (existed && !config.overwrite) {
                return logger.log('debug', {
                    data: [file],
                    message: 'not overwrite exist template mock file %s'
                });
            }
            // generate mock parameters
            let ret = {}, changed = false;
            params.forEach((param)=> {
                changed = changed || param.updateTime > config.checkTime;
                ret[param.name] = this.genMockData(param);
            });
            // 页面标题
            ret.title = ret.title || it.name;
            // 页面描述
            ret.description = ret.description || it.description;
            // check changed
            if (existed && !changed) {
                return logger.log('debug', {
                    data: [file],
                    message: 'template mock file %s not changed'
                });
            }
            // output mock data
            this.output(file, JSON.stringify(ret, null, 4));
            // check filter generator
            if (!config.filter) {
                return;
            }
            // check filter
            file = `${config.mockRoot}${mock}.js`;
            if (!_fs.exist(file)) {
                let content = this.mergeTemplate(config.filter);
                this.output(file, content);
            } else {
                logger.log('debug', {
                    data: [file],
                    message: 'mock template filter exist %s'
                });
            }
        });
    }

    /**
     * 根据请求对象, 返回真实的请求 url
     * 主要是 get 请求, 需要处理查询参数
     * @param  {object}  it - interface object
     * @return {string} request url
     */
    getInterfaceRequestUrl(it) {
        let method = this.getReqMethod(it.method);
        let url = it.path;
        // 如果是 get 请求, 需要将输入参数添加到 url 当中去
        if (method === 'GET') {
            let queryStrObj = {};
            it.inputs.forEach((input) => {
                // 可能有多个相同的查询参数, 统一使用数组的形式
                if (!queryStrObj[input.name]) {
                    queryStrObj[input.name] = [];
                }
                queryStrObj[input.name].push('');
            });
            let queryStr = querystring.stringify(queryStrObj);
            if (queryStr) {
                if (url.indexOf('?') === -1) {
                    url += `?${queryStr}`;
                } else {
                    url += `&${queryStr}`;
                }
            }
        }
        return url;
    }

    /**
     * 根据请求对象的请求 url, 返回模拟数据的文件夹路径
     * @param  {string}  url - request url
     * @return {string} mock data path
     */
    getInterfaceMockDataPath(url) {
        // windows 的文件夹名称不能有特殊字符, 将 url 中的 ": ? & =" 转成 "/_/"
        let filePath = _path.normalize(url.replace(/:|\?|&|=/g, '/_/') + '/data');
        return filePath;
    }

    /**
     * build interface mock data
     * @param  {array}  list - interface list
     * @param  {object}  config - config object
     * @return {undefined}
     */
    buildInterfaceMock(list, config) {
        let mock = config.mockRoot;
        (list || []).forEach((it)=> {
            let method = `./${this.getReqMethod(it.method).toLowerCase()}/`;
            let url = this.getInterfaceRequestUrl(it);
            let name = this.getInterfaceMockDataPath(url);
            let suffix = _path.absoluteAltRoot(method + name, mock, mock);
            it.mock = suffix.replace(mock, '/');
            let file = suffix + '.json';
            let existed = _fs.exist(file);
            // check overwrite
            if (existed && !config.overwrite) {
                logger.log('debug', {
                    message: `not overwrite exist api mock file ${file}`
                });
                return;
            }
            // check changed
            let ret = {};
            let changed = !1;
            (it.outputs || []).forEach((attr)=> {
                changed = changed || attr.updateTime > config.checkTime;
                ret[attr.name] = this.genMockData(attr);
            });
            // check changed
            if (existed && !changed) {
                logger.log('debug', {
                    message: `api mock file ${file} not changed`
                });
                return;
            }
            // output mock file
            this.output(file, JSON.stringify(ret, null, 4));
            // check filter generator
            if (!config.filter) {
                return;
            }
            // output mock filter
            file = suffix + '.js';
            if (!_fs.exist(file)) {
                let content = this.mergeTemplate(
                    config.filter
                );
                this.output(file, content);
            } else {
                logger.log('debug', {
                    message: `mock api filter exist ${file}`
                });
            }
        });
    }

    /**
     * build mock filter
     * @param  {array}   list - interface list
     * @return {undefined}
     */
    buildInterfaceRules(list) {
        (list || []).forEach((it) => {
            let url = this.getInterfaceRequestUrl(it);
            this.rules.push({
                path: url,
                mockDataPath: this.getInterfaceMockDataPath(url),
                method: this.getReqMethod(it.method),
                id: it.id,
                type: 'api',
                name: it.name
            });
        });
    }

    /**
     * output file content synchronous
     * @param  {string} file - file path
     * @param  {string} content - file content
     * @return {undefined}
     */
    output(file, content) {
        _io.outputSync(file, content);
        logger.log('debug', {
            data: [file],
            message: 'output %s'
        });
    }

    /**
     * after output done
     * @return {undefined}
     */
    afterOutput() {
        this.beforeDone();
        // output nei config file for build and update
        if (/^(build|update)$/.test(this.config.action)) {
            let file = _path.absolute(
                './nei.json',
                this.cnfRoot
            );
            this.config.outputRoot = './';
            logger.log('debug', {
                data: [file],
                message: 'output %s'
            });
            this.output(
                file, JSON.stringify(
                    this.config, null, 4
                )
            );
        }
        logger.log('info', {
            message: 'build success'
        });
    }

    /**
     * do something before build done
     * @param  {object} config - nei config will be outputted
     * @return {undefined}
     */
    beforeDone() {
        // do something by subclass
    }

    /**
     * prepare to start exec
     * @param  {function} next - action function
     * @param  {object} data - data from nei
     * @return {undefined}
     */
    start(next, data) {
        // save update time
        this.config.updateTime = data.timestamp;
        this.data = data;
        this.formatData();
        next.call(this);
        this.afterOutput();
    }

    /**
     * build project
     * @param  {object} [data] - nei resource data
     * @return {undefined}
     */
    build(data) {
        this.start(this.buildStart, data);
    }

    /**
     * build project, implementation by subclass
     * @return {undefined}
     */
    buildStart() {
        // do something by subclass
    }

    /**
     * update project api
     * @param  {object} data - nei resource data
     * @return {undefined}
     */
    update(data) {
        this.start(this.updateStart, data);
    }

    /**
     * mock template data
     * @return {undefined}
     */
    mockTemplate() {
        let list = this.data.templates || [];
        // format mock file name
        list.forEach((it) => {
            it.mock = this.parseFileName(
                it.path, this.config.outputRoot
            );
        });
        // check suffix
        let suffix = '';
        if (this.mockType === 0) {
            suffix = 'views/';
        }
        // output template mock data
        this.buildTemplateMock(list, {
            mockRoot: this.config.outputRoot + suffix,
            overwrite: this.options.overwrite,
            checkTime: 0
        });
    }

    /**
     * mock interface data
     * @return {undefined}
     */
    mockInterface() {
        let list = this.data.interfaces || [];
        // check suffix
        let mockRoot = this.config.outputRoot;
        if (this.mockType === 0) {
            mockRoot = mockRoot + 'api/';
        }
        // output template mock data
        this.buildInterfaceMock(list, {
            mockRoot: mockRoot,
            overwrite: this.options.overwrite,
            checkTime: 0
        });
        let rules = [];
        list.forEach((it) => {
            rules.push({
                path: it.path,
                mock: it.mock.replace(/^\//, ''),
                method: this.getReqMethod(it.method),
                id: it.id
            });
        });
        if (this.mockFiddler) {
            // generate fiddler rules config file for local
            let file = `${this.config.outputRoot}fiddler.${this.config.id}.farx`;
            let content = this.mergeTemplate(
                this.options.tplRoot + 'fiddler.farx', {
                    rules: rules,
                    root: mockRoot
                }
            );
            this.output(file, content);
            // generate fiddler rules config file for nei
            file = `${this.config.outputRoot}fiddler.${this.config.id}.nei.farx`;
            content = this.mergeTemplate(
                this.options.tplRoot + 'fiddler.nei.farx', {
                    rules: rules,
                    root: mockRoot,
                    api: util.format(
                        (require('../../package.json').nei || {}).mock, 3
                    )
                }
            );
            this.output(file, content);
        }
        if (this.mockCharles) {
            // generate charles rules config file
            let file = `${this.config.outputRoot}charles.${this.config.id}.xml`;
            let content = this.mergeTemplate(
                this.options.tplRoot + 'charles.xml', {
                    rules: rules,
                    root: mockRoot
                }
            );
            this.output(file, content);
        }
    }

    /**
     * mock data type
     * @return {undefined}
     */
    mockDataType() {
        let mockRoot = this.config.outputRoot + 'meta/';
        Object.keys(this.dataTypes).forEach((key)=> {
            let it = this.dataTypes[key];
            let file = mockRoot + it.name + '.json';
            let data = this.genMockData({
                type: it.id
            });
            this.output(file, JSON.stringify(data, null, 4));
        });
    }

    /**
     * generator project mock data
     * @return {undefined}
     */
    mockStart() {
        this.mockDataType();
        // output template mock data
        if (this.mockType === 0 || this.mockType === 1) {
            this.mockTemplate();
        }
        // output interface mock data
        if (this.mockType === 0 || this.mockType === 2) {
            this.mockInterface();
        }
    }

    /**
     * mock data api
     * @param  {object} data - nei resource data
     * @return {undefined}
     */
    mock(data) {
        this.mockType = parseInt(this.config.type, 10) || 0;
        this.mockFiddler = !!this.config.fiddler;
        this.mockCharles = !!this.config.charles;
        this.start(this.mockStart, data);
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
            let config = this.config;
            parent = getTopmostParent(parent);
            let isModel;
            let getFilePath = (name, isModel) => {
                let file;
                if (config.lang === 'java') {
                    file = util.format(
                        '%s/%s/%s%s.java',
                        isModel ? 'Models' : 'HttpTasks',
                        config.appPackage.replace(/\./g, '/'),
                        name,
                        isModel ? '' : 'HttpTask'
                    );
                    return file;
                } else if (config.lang === 'oc') {
                    file = util.format(
                        '%s/%s%s.h',
                        isModel ? 'Models' : 'Requests',
                        config.namePrefix,
                        name
                    );
                    return file;
                }
                // webapp
                return name;
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
        let sepLine = (() => {
            let a = [];
            a.length = 100;
            return a.join('-');
        })();
        let setDiff = (parent) => {
            parent = getTopmostParent(parent);
            if (parent) {
                diffs[parent.key][parent.id] = 1;
                // update htVersion
                if (Array.isArray(newData[parent.key])) {
                    let foundData = newData[parent.key].filter((data) => {
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
        let getClassName = (data, type) => {
            if (type === 'interfaces') {
                return this.getReqClassName(data);
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
     * @return {undefined}
     */
    diffJSONData() {
        let config = this.config;
        let data = this.data;
        data.datatypes = this.dataTypes;
        let diffResult;
        let jsonFile = util.format(
            '%snei.%s/JSON/nei-latest.json',
            config.outputRoot,
            config.id
        );
        let oldData = _util.file2json(jsonFile);
        let time = _util.getFormatTime('%s-%s-%s-%s-%s-%s-%s');
        let filePrefix = util.format(
            '%snei.%s/JSON/nei-%s',
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
                let foundOldItfs = oldData.interfaces.filter((itff) => {
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
        // todo: 要不要排除没有变化的数据？如果 diff 逻辑有误，导致无法生成变化的文件，这样用户还要等插件更新，整个过程可能比较痛苦。
        if (isChanged) {
            logger.log('debug', {
                message: `diff result: ${diffResult.changedNum}个文件被更改，请查看相应的diff.txt文件`
            });
        }
    }

    /**
     * get request name
     * @param  {object} itf - interface object
     * @param  {boolean=true} printMsg - print message to console
     * @return {string} - request name
     */
    getReqClassName(itf, printMsg) {
        let name = itf.className;
        if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
            return name;
        } else if (printMsg) {
            let tip;
            if (name) {
                tip = `接口 "${itf.name}" 的类名 "${name}" 不合法, 尝试使用名称`;
            } else {
                tip = `接口 "${itf.name}" 没有指定类名, 尝试使用名称`;
            }
            logger.log('error', {
                message: tip
            });
        }
        name = itf.name;
        if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
            return name;
        } else if (printMsg) {
            logger.log('error', {
                message: `接口 "${itf.name}" 的名称不能作为类名使用, 尝试转换 url 作为类名`
            });
        }
        // name is invalid for class name, using path's camelCase format
        return itf.path.replace(/\/(.)/g, (match, group1) => {
            return group1.toUpperCase();
        }).replace(/\//g, '');
    }
}

module.exports = Builder;

