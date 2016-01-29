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
     * @param  {object} config
     * @param  {object} options
     * @return {undefined}
     */
    constructor(config, options) {
        super();
        this.config = config;
        this.options = Object.assign({}, options, {
            overwrite: !!config.overwrite,
            checkTime: parseInt(config.updateTime, 10) || 0
        });
        this.cnfRoot = `${config.proRoot}nei.${config.id}/`;
        this.templates = {};
        this.compileTemplate();
        this.extendConfig();
    }

    /**
     * load data from nei server
     * @return {undefined}
     */
    loadData(next) {
        // load config data from nei platform
        let api = util.format(
            (require('../../package.json').nei || {}).api,
            this.config.id
        );
        logger.log('info', {
            data: [api],
            message: 'load nei config from %s'
        });
        _io.download(api, this.parseConfig.bind(this, next));
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
     * parse nei config object
     * @param  {string} content - nei config string
     * @return {undefined}
     */
    parseConfig(next, content) {
        logger.log('info', {
            message: 'parse nei config'
        });
        let ret;
        // parse content to json
        try {
            ret = JSON.parse(content);
        } catch (ex) {
            logger.log('debug', {
                data: [content],
                message: 'content from nei \n%s'
            });
            logger.log('error', {
                data: [ex.stack],
                message: 'nei config parse error\n%s'
            });
        }
        // check config data
        if (!ret) {
            return;
        }
        if (ret.code !== 200) {
            return logger.log('error', {
                data: [ret],
                message: 'illegal config data from nei %j'
            });
        }
        // check result
        ret = ret.result;
        if (!ret.timestamp) {
            return logger.log('error', {
                data: [ret],
                message: 'illegal config data from nei %j'
            });
        }
        // save update time
        this.config.updateTime = ret.timestamp;
        // build/update project
        this.data = ret;
        this.formatData();
        // do next process
        if (next) {
            next.call(
                this, this.config,
                this.options, this.data
            );
            _io.onload(this.afterOutput.bind(this));
        } else {
            this.afterOutput();
        }
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
     * @param  {object} data - template data
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
     * @param  {object} test - test for circular reference check
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
                return this._genMockData({
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
                attrs.forEach(function (it) {
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
                }, this);
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
     * @param  {Array}  list - page template list
     * @param  {object} config - config object
     * @return {undefined}
     */
    buildTemplateMock(list, config) {
        (list || []).forEach(function (it) {
            // check mock file
            let params = it.parameters,
                mock = it.mock;
            if (!params || !params.length) {
                return;
            }
            let file = util.format(
                '%s%s.json',
                config.mockRoot, mock
            );
            // check overwrite exist file
            let existed = _fs.exist(file);
            if (existed && !config.overwrite) {
                logger.log('debug', {
                    data: [file],
                    message: 'not overwrite exist template mock file %s'
                });
                return;
            }
            // generate mock parameters
            let ret = {}, changed = !1;
            params.forEach(function (param) {
                changed = changed || param.updateTime > config.checkTime;
                ret[param.name] = this.genMockData(param);
            }, this);
            // check changed
            if (existed && !changed) {
                logger.log('debug', {
                    data: [file],
                    message: 'template mock file %s not changed'
                });
                return;
            }
            // output mock data
            this.output(file, JSON.stringify(ret, null, 4));
            // check filter generator
            if (!config.filter) {
                return;
            }
            // check filter
            file = util.format(
                '%s%s.js',
                config.mockRoot, mock
            );
            if (!_fs.exist(file)) {
                let content = this.mergeTemplate(
                    config.filter
                );
                this.output(file, content);
            } else {
                logger.log('debug', {
                    data: [file],
                    message: 'mock template filter exist %s'
                });
            }
        }, this);
    }

    /**
     * build interface mock data
     * @param  {Array}   list - interface list
     * @param  {object}  config - config object
     * @return {undefined}
     */
    buildInterfaceMock(list, config) {
        let mock = config.mockRoot;
        (list || []).forEach(function (it) {
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
        }, this);
    }

    /**
     * read file content
     * @param  {string} file - file path
     * @param  {Function} callback
     * @return {undefined}
     */
    get(file, callback) {
        logger.log('debug', {
            data: [file],
            message: 'read %s'
        });
        _io.get(file, callback);
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
        this.beforeDone(this.config);
        // output nei config file for build and update
        if (/^(build|update)$/.test(this.config.action)) {
            let file = _path.absolute(
                './nei.json',
                this.cnfRoot
            );
            this.config.proRoot = './';
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
        this.emit('done');
    }

    /**
     * do something before build done
     * @param  {object} config - nei config will be outputted
     * @return {undefined}
     */
    beforeDone(config) {
        // do something by subclass
    }

    /**
     * build project api
     * @return {undefined}
     */
    build() {
        this.loadData(this._build);
    }

    /**
     * build project, implementation by subclass
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - build options
     * @param  {object}  data - data config from nei platform
     * @return {undefined}
     */
    _build(config, options, data) {
        // do something by subclass
    }

    /**
     * update project api
     * @return {undefined}
     */
    update() {
        this.loadData(this._update);
    }

    /**
     * update project, implementation by subclass
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - update options
     * @param  {object}  data - data config from nei platform
     * @return {undefined}
     */
    _update(config, options, data) {
        // do something by subclass
    }

    /**
     * mock data api
     * @param  {object}  config - config Object
     * @return {undefined}
     */
    mock(config) {
        this._mockType = parseInt(config.type, 10) || 0;
        this._mockFiddler = !!config.fiddler;
        this._mockCharles = !!config.charles;
        this.loadData(this._mock);
    }

    /**
     * mock template data
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - update options
     * @param  {object}  data - data config from nei platform
     * @return {undefined}
     */
    mockTemplate(config, options, data) {
        let list = data.templates || [];
        // format mock file name
        list.forEach(function (it) {
            it.mock = this.parseFileName(
                it.path, config.proRoot
            );
        }, this);
        // check suffix
        let sufix = '';
        if (this._mockType === 0) {
            sufix = 'views/';
        }
        // output template mock data
        this.buildTemplateMock(list, {
            mockRoot: config.proRoot + sufix,
            overwrite: options.overwrite,
            checkTime: 0
        });
    }

    /**
     * mock interface data
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - update options
     * @param  {object}  data - data config from nei platform
     * @return {undefined}
     */
    mockInterface(config, options, data) {
        let list = data.interfaces || [];
        // check suffix
        let mockRoot = config.proRoot;
        if (this._mockType === 0) {
            mockRoot = mockRoot + 'api/';
        }
        // output template mock data
        this.buildInterfaceMock(list, {
            mockRoot: mockRoot,
            overwrite: options.overwrite,
            checkTime: 0
        });
        let rules = [];
        list.forEach(function (it) {
            rules.push({
                path: it.path,
                mock: it.mock.replace(/^\//, ''),
                method: this.parseReqMethod(it.method)
            })
        }, this);
        if (this._mockFiddler) {
            // generate fiddler rules config file
            let file = util.format(
                '%sfiddler.%s.farx',
                config.proRoot,
                config.id
            );
            let content = this.mergeTemplate(
                this._tplRoot + 'fiddler.farx', {
                    rules: rules,
                    root: mockRoot
                }
            );
            this._output(file, content);
        }
        if (this._mockCharles) {
            // generate charles rules config file
            let file = util.format(
                '%scharles.%s.xml',
                config.proRoot,
                config.id
            );
            let content = this.mergeTemplate(
                this._tplRoot + 'charles.xml', {
                    rules: rules,
                    root: mockRoot
                }
            );
            this._output(file, content);
        }
    }

    /**
     * mock data type
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - update options
     * @return {undefined}
     */
    mockDataType(config, options) {
        let mockRoot = config.proRoot + 'meta/';
        Object.keys(this.dataTypes).forEach(
            function (key) {
                let it = this.dataTypes[key],
                    file = mockRoot + it.name + '.json',
                    data = this.genMockData({
                        type: it.id
                    });
                this.output(file, JSON.stringify(data, null, 4));
            }, this
        );
    }

    /**
     * generator project mock data
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - update options
     * @param  {object}  data - data config from nei platform
     * @return {undefined}
     */
    mock(config, options, data) {
        // mock meta data
        this.mockDataType.apply(this, arguments);
        // output template mock data
        if (this._mockType === 0 || this._mockType === 1) {
            this.mockTemplate.apply(this, arguments);
        }
        // output interface mock data
        if (this._mockType === 0 || this._mockType === 2) {
            this.mockInterface.apply(this, arguments);
        }
    }

    /**
     * generator toolkit config file
     * @param  {object}  config - config Object
     * @param  {number}  config.type - config file type
     * @return {undefined}
     */
    export(config) {
        let reg1 = /^https?:\/\//i;
        var reg2 = /\/+$/;
        let doFormatDM = (domain) => {
            domain = (domain || 'localhost').replace(reg2, '');
            if (!reg1.test(domain)) {
                return 'http://' + domain;
            }
            return domain;
        };
        this.__expDomain = doFormatDM(config.domain);
        this.__expFile = `${this.config.proRoot}nei-${this.config.id}-postman.json`;
        // check overwrite
        if (_fs.exist(this.__expFile) && !this.options.overwrite) {
            logger.log('error', {
                data: [this.__expFile],
                message: 'config file %s exsited, use -w or -overwrite options to overwrite this file'
            });
            return logger.log('done');
        }
        this.loadData(this._export);
    }

    /**
     * mock path parameters
     * @param  {object} api - api config
     * @return {undefined}
     */
    mockPathParam(api) {
        let ret = {},
            params = api.inputs || [];
        params.forEach(
            function (it) {
                ret[it.name] = this.genMockData(it);
            }, this
        );
        api.mock = JSON.stringify(ret);
        api.query = qs.stringify(ret);
        if (!!api.query) {
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
        var params = api.inputs || [];
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

    /**
     * generator toolkit config file
     * @param  {object}  config - config object, parameters return from this.config api
     * @param  {object}  options - update options
     * @param  {object}  data - data config from nei platform
     * @return {undefined}
     */
    _export(config, options, data) {
        // generator mock data
        let list = data.interfaces || [];
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
            this._tplRoot + 'postman.json', {
                apis: list,
                project: data.project,
                domain: this.__expDomain,
                timestamp: config.updateTime
            }
        );
        this.output(this.__expFile, content);
    }
}

module.exports = Builder;

