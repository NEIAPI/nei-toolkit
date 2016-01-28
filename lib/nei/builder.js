/*
 * Abstract NEI Builder
 * @module   nei/builder
 * @author   genify(caijf@corp.netease.com)
 */
var vm = require('vm');
var util = require('util');
var swig = require('swig');
var qs = require('querystring');
var _io = require('../util/io.js');
var _fs = require('../util/file.js');
var _path = require('../util/path.js');
var _util = require('../util/util.js');

// nei builder
// id         - nei project id
// proRoot    - absolute project root path
// updateTime - last update time
// overwrite  - whether overwrite file existed
var NEIBuilder = module.exports = require('../util/klass.js').create();
var pro = NEIBuilder.extend(require('../util/event.js'));
/**
 * class initialization
 * @param  {Object} config - config parameters
 * @param  {Object} [argInstance] - Arg Class instance
 * @return {Void}
 */
pro.init = function (config, argInstance) {
    this._super(config);
    // init template
    this._tplRoot = _path.absolute(
        './template/', __dirname + '/'
    );
    this._template();
    // init config
    config = config || {};
    this._config = Object.assign(config, this._filter(config));
    // init build/update config
    this._options = {
        overwrite: !!config.overwrite,
        checkTime: parseInt(config.updateTime, 10) || 0
    };
    // generator config root
    this._cnfRoot = `${this._config.proRoot}nei.${this._config.id}/`;
    this._argInstance = argInstance;
};
/**
 * load data from nei server
 * @private
 * @return {Void}
 */
pro.loadData = function (next) {
    // load config data from nei platform
    var api = util.format(
        (require('../../package.json').nei || {}).api,
        this._config.id
    );
    this.emit('info', {
        data: [api],
        message: 'load nei config from %s'
    });
    _io.download(api, this._parseConfig.bind(this, next));
};
/**
 * convert path to filename
 * @protected
 * @param  {String} path - template file path
 * @param  {String} root - view root path
 * @return {String} file name
 */
pro._parseFileName = function (path, root) {
    var file = _path.absoluteAltRoot(path, root, root);
    return file.replace(root, '').replace(/\.[^\/]*?$/, '');
};
/**
 * convert method value to name
 * @protected
 * @param  {Number} value - method value
 * @return {Function} method name
 */
pro._parseReqMethod = (function () {
    var method = ['POST', 'GET', 'PUT', 'DELETE', 'HEAD'];
    return function (value) {
        return method[value] || 'GET';
    };
})();
/**
 * parse nei config object
 * @private
 * @param  {String} content - nei config string
 * @return {Void}
 */
pro._parseConfig = function (next, content) {
    this.emit('info', {
        message: 'parse nei config'
    });
    // parse content to json
    try {
        // timestamp    - current timestamp
        // pages        - [{id,path,name,description,parameters,updateTime}]
        // templates    - [{id,path,name,description,parameters,updateTime}]
        // interfaces   - [{id,name,description,path,method,isRest,inputs,outputs,updateTime}]
        // datatypes    - [{id,name,format,updateTime}]
        // attributes   - [{id,name,type,isArray,updateTime}]
        // project      - {id,name,group}
        var ret = JSON.parse(content);
    } catch (ex) {
        this.emit('debug', {
            data: [content],
            message: 'content from nei \n%s'
        });
        this.emit('error', {
            data: [ex.stack],
            message: 'nei config parse error\n%s'
        });
    }
    // check config data
    if (!ret) {
        return;
    }
    if (ret.code !== 200) {
        this.emit('error', {
            data: [ret],
            message: 'illegal config data from nei %j'
        });
        return;
    }
    // check result
    var ret = ret.result;
    if (!ret.timestamp) {
        this.emit('error', {
            data: [ret],
            message: 'illegal config data from nei %j'
        });
        return;
    }
    // save update time
    this._config.updateTime = ret.timestamp;
    // build/update project
    this._data = this._format(ret) || ret;
    // do next process
    if (next) {
        next.call(
            this, this._config,
            this._options, this._data
        );
        _io.onload(this._afterOutput.bind(this));
    } else {
        this._afterOutput();
    }
};
/**
 * parse template under dir
 * @protected
 * @param  {String} dir - template directory
 * @return {Void}
 */
pro._parseTemplate = function (dir) {
    // init template cache
    if (!this._templates) {
        this._templates = {};
    }
    // dump template
    _fs.lsfile(dir, (name, file) => {
        this.emit('debug', {
            data: [file],
            message: 'complie template %s'
        });
        this._templates[file] = swig.compileFile(file, {autoescape: !1});
    });
};
/**
 * merge template with data
 * @protected
 * @param  {String} file - key of template
 * @param  {Object} data - template data
 * @return {String} content after merge data
 */
pro._mergeTemplate = function (file, data) {
    file = _path.normalize(file);
    var func = (this._templates || {})[file];
    if (!!func) {
        return func(data || {});
    }
    this.emit('warn', {
        data: [file],
        message: 'template [%s] not exist'
    });
    return '';
};
/**
 * format config data
 * @protected
 * @param  {Object} data - config data
 * @return {Void}
 */
pro._format = function (data) {
    // format project information
    if (!data.project) {
        var id = this._config.id;
        data.project = {
            id: id,
            name: 'NEI-PROJECT-' + id,
            group: 'NEI-GROUP-' + id
        };
    }
    // format data types
    this._types = {};
    (data.datatypes || []).forEach(
        function (it) {
            it.attrs = [];
            this._types[it.id] = it;
        }, this
    );
    delete data.datatypes;
    // format type attributes
    (data.attributes || data.attributeList || []).forEach(
        function (it) {
            var type = this._types[it.parentId];
            if (!type) {
                return;
            }
            type.attrs.push(it);
        }, this
    );
    delete data.attributes;
    delete data.attributeList;
    // format data from nei
    //this.emit('debug',{
    //    data:[this._types],
    //    message:'datatype from nei -> %j'
    //});
};
/**
 * generate mock data for data type
 * @protected
 * @param  {Object}  config - type config object
 * @param  {Number}  config.type        - data type id
 * @param  {Boolean} config.isArray     - is array mock
 * @param  {String}  config.description - type description
 * @param  {Object=} test - test for circular reference check
 * @return {Variable} mock data
 */
pro._genMockData = (function () {
    var str2json = function (code) {
        if (!code) {
            return;
        }
        try {
            // try json parse
            return JSON.parse(code);
        } catch (ex) {
            try {
                // try eval
                var sandbox = {};
                vm.createContext(sandbox);
                vm.runInContext(util.format('ret = %s', code || ''), sandbox);
                return sandbox.ret;
            } catch (e) {
                // ignore
            }
        }
    };
    var fmap = {
        // Variable
        10000: function (config) {
            var ret = str2json(config.description);
            if (ret != null) {
                return ret;
            }
            return this._genMockData({
                type: _util.randNext([10001, 10002, 10003])
            });
        },
        // String
        10001: function (config) {
            return config.defaultValue || _util.randString(
                    _util.rand(5, 20)
                );
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
    return function (config, test) {
        var type = config.type,
            isArray = config.isArray === 1;
        // for system type
        var ret,
            func = fmap[type];
        if (!!func) {
            ret = func.call(this, config);
        }
        if (ret == null) {
            var conf = this._types[type],
                attrs = conf.attrs || [];
            if (conf.format == 2) {
                // for array type
                var stp = {
                    isArray: 1,
                    type: conf.subtype
                };
                return this._genMockData(stp, test);
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
                    var dat = null;
                    // for circular reference check
                    test = test || {};
                    if (!test[it.type]) {
                        dat = this._genMockData(it, test);
                        delete test[it.type];
                    } else {
                        console.log(
                            'circular reference %s:%s in %s:%s',
                            it.type, this._types[it.type].name, type, conf.name
                        );
                    }
                    ret[it.name] = dat;
                }, this);
            }
        }
        // generate array
        if (isArray) {
            var ret = [ret];
            for (var i = _util.rand(5, 10), it; i >= 0; i--) {
                it = _util.merge(config, {
                    isArray: 0
                });
                ret.push(this._genMockData(it, {}));
            }
        }
        return ret;
    };
})();
/**
 * build template mock data
 * @private
 * @param  {Array}  list - page template list
 * @param  {Object} config - config object
 * @param  {String}  config.mockRoot  - template mock data root path
 * @param  {Boolean} config.overwrite - whether overwrite mock file existed
 * @param  {Number}  config.checkTime - check time
 * @param  {String}  config.filter    - filter file template
 * @return {Void}
 */
pro._buildTemplateMock = function (list, config) {
    (list || []).forEach(function (it) {
        // check mock file
        var params = it.parameters,
            mock = it.mock;
        if (!params || !params.length) {
            return;
        }
        var file = util.format(
            '%s%s.json',
            config.mockRoot, mock
        );
        // check overwrite exist file
        var existed = _fs.exist(file);
        if (existed && !config.overwrite) {
            this.emit('debug', {
                data: [file],
                message: 'not overwrite exist template mock file %s'
            });
            return;
        }
        // generate mock parameters
        var ret = {}, changed = !1;
        params.forEach(function (param) {
            changed = changed || param.updateTime > config.checkTime;
            ret[param.name] = this._genMockData(param);
        }, this);
        // check changed
        if (existed && !changed) {
            this.emit('debug', {
                data: [file],
                message: 'template mock file %s not changed'
            });
            return;
        }
        // output mock data
        this._output(file, JSON.stringify(ret, null, 4));
        // check filter generator
        if (!config.filter) {
            return;
        }
        // check filter
        var file = util.format(
            '%s%s.js',
            config.mockRoot, mock
        );
        if (!_fs.exist(file)) {
            var content = this._mergeTemplate(
                config.filter
            );
            this._output(file, content);
        } else {
            this.emit('debug', {
                data: [file],
                message: 'mock template filter exist %s'
            });
        }
    }, this);
};
/**
 * build interface mock data
 * @private
 * @param  {Array}   list - interface list
 * @param  {Object}  config - config object
 * @param  {String}  config.mockRoot  - mock root
 * @param  {Boolean} config.overwrite - whether overwrite exist file
 * @param  {Number}  config.checkTime - check time
 * @param  {String}  config.filter    - filter file template
 * @return {Void}
 */
pro._buildInterfaceMock = function (list, config) {
    var mock = config.mockRoot;
    (list || []).forEach(function (it) {
        var name = it.path.replace(/[^\w\/]|(?:\/$)/g, ''),
            method = './' + this._parseReqMethod(it.method).toLowerCase() + '/',
            sufix = _path.absoluteAltRoot(method + name, mock, mock);
        it.mock = sufix.replace(mock, '/');
        var file = sufix + '.json',
            existed = _fs.exist(file);
        // check overwrite
        if (existed && !config.overwrite) {
            this.emit('debug', {
                data: [file],
                message: 'not overwrite exist api mock file %s'
            });
            return;
        }
        // check changed
        var ret = {}, changed = !1;
        (it.outputs || []).forEach(function (attr) {
            changed = changed || attr.updateTime > config.checkTime;
            ret[attr.name] = this._genMockData(attr);
        }, this);
        // check changed
        if (existed && !changed) {
            this.emit('debug', {
                data: [file],
                message: 'api mock file %s not changed'
            });
            return;
        }
        // output mock file
        this._output(file, JSON.stringify(ret, null, 4));
        // check filter generator
        if (!config.filter) {
            return;
        }
        // output mock filter
        var file = sufix + '.js';
        if (!_fs.exist(file)) {
            var content = this._mergeTemplate(
                config.filter
            );
            this._output(file, content);
        } else {
            this.emit('debug', {
                data: [file],
                message: 'mock api filter exist %s'
            });
        }
    }, this);
};
/**
 * read file content
 * @protected
 * @param  {String} file - file path
 * @return {Void}
 */
pro._get = function (file, callback) {
    this.emit('debug', {
        data: [file],
        message: 'read %s'
    });
    _io.get(file, callback);
};
/**
 * output file content
 * @protected
 * @param  {String} file - file path
 * @param  {String} content - file content
 * @return {Void}
 */
pro._output = function (file, content) {
    _io.output(file, content);
    this.emit('debug', {
        data: [file],
        message: 'output %s'
    });
};
/**
 * output file content synchronous
 * @protected
 * @param  {String} file - file path
 * @param  {String} content - file content
 * @return {Void}
 */
pro._outputSync = function (file, content) {
    _io.outputSync(file, content);
    this.emit('debug', {
        data: [file],
        message: 'sync output %s'
    });
};
/**
 * after output done
 * @private
 * @return {Void}
 */
pro._afterOutput = function () {
    this._beforeDone(this._config);
    // output nei config file for build and update
    if (this._action === 'build' || this._action === 'update') {
        var file = _path.absolute(
            './nei.json',
            this._cnfRoot
        );
        this._config.proRoot = './';
        this.emit('debug', {
            data: [file],
            message: 'output %s'
        });
        _io.output(
            file, JSON.stringify(
                this._argInstance.filterConfig(this._config), null, 4
            )
        );
    }
    this.emit('info', {
        message: 'build success'
    });
    this.emit('done');
};
/**
 * filter config field from input
 * @protected
 * @param  {Object} config - config data
 * @return {Object} result will be save to config file
 */
pro._filter = function (config) {
    // do something by subclass
};
/**
 * init template
 * @protected
 * @return {Void}
 */
pro._template = function () {
    this._parseTemplate(this._tplRoot);
};
/**
 * do something before build done
 * @protected
 * @param  {Object} config - nei config will be outputted
 * @return {Void}
 */
pro._beforeDone = function (config) {
    // do something by subclass
};
/**
 * build project api
 * @return {Void}
 */
pro.build = function () {
    this._action = 'build';
    this.loadData(this._build);
};
/**
 * build project, implementation by subclass
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
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
    // do something by subclass
};
/**
 * update project api
 * @return {Void}
 */
pro.update = function () {
    this._action = 'update';
    this.loadData(this._update);
};
/**
 * update project, implementation by subclass
 * @protected
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
    // do something by subclass
};
/**
 * mock data api
 * @param  {Object}  config - config Object
 * @param  {Number}  config.type    - mock data type
 * @param  {String} config.fiddler - whether generator fiddler config
 * @return {Void}
 */
pro.mock = function (config) {
    this._action = 'mock';
    this._mockType = parseInt(config.type, 10) || 0;
    this._mockFiddler = !!config.fiddler;
    this._mockCharles = !!config.charles;
    this.loadData(this._mock);
};
/**
 * mock template data
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._mockTemplate = function (config, options, data) {
    var list = data.templates || [];
    // format mock file name
    list.forEach(function (it) {
        it.mock = this._parseFileName(
            it.path, config.proRoot
        );
    }, this);
    // check suffix
    var sufix = '';
    if (this._mockType === 0) {
        sufix = 'views/';
    }
    // output template mock data
    this._buildTemplateMock(list, {
        mockRoot: config.proRoot + sufix,
        overwrite: options.overwrite,
        checkTime: 0
    });
};
/**
 * mock interface data
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._mockInterface = function (config, options, data) {
    var list = data.interfaces || [];
    // check suffix
    var mockRoot = config.proRoot;
    if (this._mockType === 0) {
        mockRoot = mockRoot + 'api/';
    }
    // output template mock data
    this._buildInterfaceMock(list, {
        mockRoot: mockRoot,
        overwrite: options.overwrite,
        checkTime: 0
    });
    var rules = [];
    list.forEach(function (it) {
        rules.push({
            path: it.path,
            mock: it.mock.replace(/^\//, ''),
            method: this._parseReqMethod(it.method)
        })
    }, this);
    if (this._mockFiddler) {
        // generate fiddler rules config file
        var file = util.format(
            '%sfiddler.%s.farx',
            config.proRoot,
            config.id
        );
        var content = this._mergeTemplate(
            this._tplRoot + 'fiddler.farx', {
                rules: rules,
                root: mockRoot
            }
        );
        this._output(file, content);
    }
    if (this._mockCharles) {
        // generate charles rules config file
        var file = util.format(
            '%scharles.%s.xml',
            config.proRoot,
            config.id
        );
        var content = this._mergeTemplate(
            this._tplRoot + 'charles.xml', {
                rules: rules,
                root: mockRoot
            }
        );
        this._output(file, content);
    }


};
/**
 * mock data type
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @return {Void}
 */
pro._mockDataType = function (config, options) {
    var mockRoot = config.proRoot + 'meta/';
    Object.keys(this._types).forEach(
        function (key) {
            var it = this._types[key],
                file = mockRoot + it.name + '.json',
                data = this._genMockData({
                    type: it.id
                });
            this._output(file, JSON.stringify(data, null, 4));
        }, this
    );
};
/**
 * generator project mock data
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._mock = function (config, options, data) {
    // mock meta data
    this._mockDataType.apply(this, arguments);
    // output template mock data
    if (this._mockType === 0 || this._mockType === 1) {
        this._mockTemplate.apply(this, arguments);
    }
    // output interface mock data
    if (this._mockType === 0 || this._mockType === 2) {
        this._mockInterface.apply(this, arguments);
    }
};
/**
 * generator toolkit config file
 * @param  {Object}  config - config Object
 * @param  {Number}  config.type - config file type
 * @return {Void}
 */
pro.export = (function () {
    var reg1 = /^https?:\/\//i,
        reg2 = /\/+$/,
        cmap = {
            0: 'postman'
        };
    var _doFormatDM = function (domain) {
        domain = (domain || 'localhost').replace(reg2, '');
        if (!reg1.test(domain)) {
            return 'http://' + domain;
        }
        return domain;
    };
    return function (config) {
        this.__expDomain = _doFormatDM(
            config.domain
        );
        this.__expFile = util.format(
            '%snei-%s-postman.json',
            this._config.proRoot,
            this._config.id
        );
        // check overwrite
        if (_fs.exist(this.__expFile) && !this._options.overwrite) {
            this.emit('error', {
                data: [this.__expFile],
                message: 'config file %s exsited, use -w or -overwrite options to overwrite this file'
            });
            this.emit('done');
            return;
        }
        this._action = 'export';
        this.loadData(this._export);
    };
})();
/**
 * mock path parameters
 * @private
 * @param  {Object} api - api config
 * @return {Void}
 */
pro._mockPathParam = function (api) {
    var ret = {},
        params = api.inputs || [];
    params.forEach(
        function (it) {
            ret[it.name] = this._genMockData(it);
        }, this
    );
    api.mock = JSON.stringify(ret);
    api.query = qs.stringify(ret);
    if (!!api.query) {
        api.query = '?' + api.query;
    }
};
/**
 * mock body parameters
 * @private
 * @param  {Object} api - api config
 * @return {Void}
 */
pro._mockBodyParam = function (api) {
    var ret = [],
        params = api.inputs || [];
    params.forEach(
        function (it) {
            ret.push({
                key: it.name,
                type: 'text',
                enabled: true,
                value: this._genMockData(it)
            });
        }, this
    );
    api.mock = JSON.stringify(ret);
};
/**
 * generator toolkit config file
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
pro._export = function (config, options, data) {
    // generator mock data
    var list = data.interfaces || [];
    list.forEach(
        function (it) {
            it.method = this._parseReqMethod(it.method);
            it.method !== 'POST' ? this._mockPathParam(it)
                : this._mockBodyParam(it);
        }, this
    );
    // sort by path
    list.sort(function (a, b) {
        return a.path > b.path ? 1 : -1;
    });
    // output content
    var content = this._mergeTemplate(
        this._tplRoot + 'postman.json', {
            apis: list,
            project: data.project,
            domain: this.__expDomain,
            timestamp: config.updateTime
        }
    );
    this._output(this.__expFile, content);
};