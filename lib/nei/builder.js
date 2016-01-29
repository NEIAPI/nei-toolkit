/*
 * Abstract NEI Builder
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */

'use strict';

let vm = require('vm');
let util = require('util');
let swig = require('swig');
let qs = require('querystring');
let EventEmitter = require('events');
let _io = require('../util/io.js');
let _fs = require('../util/file.js');
let _path = require('../util/path.js');
let _util = require('../util/util.js');
let logger = require('../util/logger');

const METHODS_LIST = ['POST', 'GET', 'PUT', 'DELETE', 'HEAD'];

class Builder extends EventEmitter {
    /**
     * class constructor
     * @param  {object} config -
     * @param  {object} options - build options
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
    parseReqMethod(value) {
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
            data: [file],
            message: 'template [%s] not exist'
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
                    return Number(config.defaultValue) || _util.increment();
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
        let type = config.type,
            isArray = config.isArray === 1;
        // for system type
        let ret,
            func = fmap[type];
        if (!!func) {
            ret = func.call(this, config);
        }
        if (ret == null) {
            let conf = this.dataTypes[type],
                attrs = conf.attrs || [];
            if (conf.format == 2) {
                // for array type
                let stp = {
                    isArray: 1,
                    type: conf.subtype
                };
                return this.genMockData(stp, test);
            } else if (conf.format == 1) {
                // for enumeration type
                conf = _util.randNext(attrs) || {};
                ret = conf.name || '';
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
                            data: [it.type, this.dataTypes[it.type].name, type, conf.name],
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
            let ret = {}, changed = !1;
            params.forEach((param)=> {
                changed = changed || param.updateTime > config.checkTime;
                ret[param.name] = this.genMockData(param);
            });
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
     * build interface mock data
     * @param  {array}  list - interface list
     * @param  {object}  config - config object
     * @return {undefined}
     */
    buildInterfaceMock(list, config) {
        let mock = config.mockRoot;
        (list || []).forEach((it)=> {
            let name = it.path.replace(/[^\w\/]|(?:\/$)/g, '');
            let method = './' + this.parseReqMethod(it.method).toLowerCase() + '/';
            let sufix = _path.absoluteAltRoot(method + name, mock, mock);
            it.mock = sufix.replace(mock, '/');
            let file = sufix + '.json',
                existed = _fs.exist(file);
            // check overwrite
            if (existed && !config.overwrite) {
                logger.log('debug', {
                    data: [file],
                    message: 'not overwrite exist api mock file %s'
                });
                return;
            }
            // check changed
            let ret = {}, changed = !1;
            (it.outputs || []).forEach((attr)=> {
                changed = changed || attr.updateTime > config.checkTime;
                ret[attr.name] = this.genMockData(attr);
            });
            // check changed
            if (existed && !changed) {
                logger.log('debug', {
                    data: [file],
                    message: 'api mock file %s not changed'
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
            file = sufix + '.js';
            if (!_fs.exist(file)) {
                let content = this.mergeTemplate(
                    config.filter
                );
                this.output(file, content);
            } else {
                logger.log('debug', {
                    data: [file],
                    message: 'mock api filter exist %s'
                });
            }
        });
    }

    /**
     * output file content
     * @param  {string} file - file path
     * @param  {string} content - file content
     * @return {undefined}
     */
    output(file, content) {
        _io.output(file, content);
        logger.log('debug', {
            data: [file],
            message: 'output %s'
        });
    }

    /**
     * output file content synchronous
     * @param  {string} file - file path
     * @param  {string} content - file content
     * @return {undefined}
     */
    outputSync(file, content) {
        _io.outputSync(file, content);
        logger.log('debug', {
            data: [file],
            message: 'sync output %s'
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
            _io.output(
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
     * build project api
     * @param  {object} data - nei resource data
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
        let sufix = '';
        if (this.mockType === 0) {
            sufix = 'views/';
        }
        // output template mock data
        this.buildTemplateMock(list, {
            mockRoot: this.config.outputRoot + sufix,
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
                method: this.parseReqMethod(it.method)
            })
        });
        if (this.mockFiddler) {
            // generate fiddler rules config file
            let file = `${this.config.outputRoot}fiddler.${this.config.id}.farx`;
            let content = this.mergeTemplate(
                this.options.tplRoot + 'fiddler.farx', {
                    rules: rules,
                    root: mockRoot
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
     * generator toolkit config file
     * @return {undefined}
     */
    export(data) {
        let reg1 = /^https?:\/\//i;
        let reg2 = /\/+$/;
        let doFormatDM = (domain) => {
            domain = (domain || 'localhost').replace(reg2, '');
            if (!reg1.test(domain)) {
                return 'http://' + domain;
            }
            return domain;
        };
        this.__expDomain = doFormatDM(this.config.domain);
        this.__expFile = `${this.config.outputRoot}nei-${this.config.id}-postman.json`;
        // check overwrite
        if (_fs.exist(this.__expFile) && !this.options.overwrite) {
            logger.log('error', {
                data: [this.__expFile],
                message: 'config file %s exsited, use -w or -overwrite options to overwrite this file'
            });
            return;
        }
        this.start(this.exportStart, data);
    }

    /**
     * generator toolkit config file
     * @return {undefined}
     */
    exportStart() {
        // generator mock data
        let list = this.data.interfaces || [];
        list.forEach((it) => {
            it.method = this.parseReqMethod(it.method);
            it.method !== 'POST' ? this.mockPathParam(it) : this.mockBodyParam(it);
        });
        // sort by path
        list.sort(function (a, b) {
            return a.path > b.path ? 1 : -1;
        });
        // output content
        let content = this.mergeTemplate(
            this.options.tplRoot + 'postman.json', {
                apis: list,
                project: this.data.project,
                domain: this.__expDomain,
                timestamp: this.config.updateTime
            }
        );
        this.output(this.__expFile, content);
    }

    /**
     * mock path parameters
     * @param  {object} api - api config
     * @return {undefined}
     */
    mockPathParam(api) {
        let ret = {};
        let params = api.inputs || [];
        params.forEach((it) => {
            ret[it.name] = this.genMockData(it);
        });
        api.mock = JSON.stringify(ret);
        api.query = qs.stringify(ret);
        if (api.query) {
            api.query = '?' + api.query;
        }
    }

    /**
     * mock body parameters
     * @param  {object} api - api config
     * @return {undefined}
     */
    mockBodyParam(api) {
        let ret = [];
        let params = api.inputs || [];
        params.forEach((it) => {
            ret.push({
                key: it.name,
                type: 'text',
                enabled: true,
                value: this.genMockData(it)
            });
        });
        api.mock = JSON.stringify(ret);
    }
}

module.exports = Builder;

