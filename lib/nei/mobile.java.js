/*
 * Mobile java builder
 * @module   nei/mobile.java
 * @author   huntbao
 */
var path = require('path');
var util = require('util');
var url = require('url');
var swig = require('swig');
var _util = require('../util/util.js');
var _fs = require('../util/file.js');
var _path = require('../util/path.js');
var MobileJava = module.exports = require('../util/klass.js').create();
var pro = MobileJava.extend(require('./mobile.js'));
var TPL_ROOT = __dirname + '/mobile/template/';

// map data type of java
pro._dataTypeMapJava = {
    10000: {typeName: 'Object'},
    10001: {typeName: 'String'},
    10002: {typeName: 'double', listTypeName: 'Double'},
    10003: {typeName: 'boolean', listTypeName: 'Boolean'}
};

/**
 * get prop java
 * @param  {Object} attr - attribute
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
 * @param  {Object} conf - config object
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
    var root = config.modelOutPath || util.format('%s%s/Models/', config.proRoot, config.id);
    var modConfig = this._modConfig || {};
    // split data type
    var ret = this._splitDataType();
    var getFileName = function (typeName) {
        return util.format(
            '%s/%s.java',
            (root + modConfig.aPkg + '/' + modConfig.mPkg).replace(/\./g, '/'),
            typeName
        );
    };
    // build enum type
    ret.enums.forEach(function (type) {
        var file = getFileName(type.name);
        var content = this._mergeTemplate(
            TPL_ROOT + 'java/enum.java', {
                conf: modConfig,
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
        var type = this._formatPropJava(this._types[id], modConfig);
        var file = getFileName(type.name);
        var content = this._mergeTemplate(
            TPL_ROOT + 'java/model.java', {
                conf: modConfig,
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
    var root = config.modelOutPath || util.format('%s%s/HttpTasks/', config.proRoot, config.id);
    var modConfig = self._modConfig || {};
    var pkgs = {};
    var getFileName = function (typeName) {
        return util.format(
            '%s/%s.java',
            (root + modConfig.aPkg + '/' + modConfig.htPkg).replace(/\./g, '/'),
            typeName
        );
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
            pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + dataTypeName] = 1;
        } else {
            itf.inputs.forEach(function (input, index) {
                var prop = self._getPropJava(input);
                if (index !== 0) {
                    prop.whiteSpace = getWhiteSpace(self._getReqClassName(itf));
                }
                inputs.push(prop);
                // if it is not system type, import model package
                if (!self._dataTypeMapJava[input.type]) {
                    pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + input.typeName] = 1;
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
                    pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + param.typeName] = 1;
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
                pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + param.typeName] = 1;
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
            pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + input.name] = 1;
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
                pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + output.typeName] = 1;
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
            pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + typeName] = 1;
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
        if (modConfig.base.indexOf('.') !== -1) {
            // full path
            baseReqPkg = modConfig.base;
        } else {
            baseReqPkg = 'com.netease.hearttouch.hthttp' + '.' + modConfig.base
        }
        var paths = modConfig.base.split('.');
        return paths[paths.length - 1];
    })();
    // build requests
    data.interfaces.forEach(function (itf) {
        pkgs = {
            'com.netease.hearttouch.hthttp.HttpMethod': 1 // default imported package
        };
        pkgs[baseReqPkg] = 1;
        var method = this._parseReqMethod(itf.method);
        var req = {
            baseClass: baseReqClass,
            inputs: getInputs(itf),
            name: this._getReqClassName(itf) + 'HttpTask',
            method: method,
            path: itf.path,
            desc: itf.description,
            outputModel: getOutputModel(itf.outputs),
            hasHost: !!url.parse(itf.path).host
        };
        var tpl = TPL_ROOT + 'java/request.java';
        if (method === 'PUT') {
            pkgs['com.netease.hearttouch.hthttp.multipart.fileupload.http.BaseFileUploadHttpRequestTask'] = 1;
            pkgs['java.io.File'] = 1;
            pkgs['java.util.HashMap'] = 1;
            // put request is file upload
            tpl = TPL_ROOT + 'java/request.put.java';
            req.mBoundary = (modConfig.aPkg.replace(/\./g, '_') + '_upload_file_boundary').toUpperCase();
        } else {
            req.params = getParams(itf);
        }
        req.pkgs = Object.keys(pkgs).sort();
        var file = getFileName(req.name);
        var content = this._mergeTemplate(tpl, {
            conf: modConfig,
            req: req
        });
        this._output(file, content);
    }, this);
};

/**
 * generator Java source code
 * @param  {Object} config - config object
 * @param  {String} config.lang   - output language
 * @param  {String} config.author - author name
 * @param  {String} config.namePrefix  - Class Name Prefix
 * @param  {String} config.reqAbstract - Request Class Abstract Name
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro.model = function (config, options, data) {
    // command line e.g.: nei mobile 11029 -l java -o ../build/pro/
    var self = this;
    // java 的请求基类名称默认为 `BaseHttpStringRequestTask`
    if (config.reqAbstract === 'HTBaseRequest') {
        config.reqAbstract = 'BaseHttpStringRequestTask';
    }
    self.initModConfig(config);
    function exec(config, options, data) {
        self._sortData(data);
        self._checkData(data, config, function (data) {
            self._exportModelJava(config, options, data);
            self._exportRequestJava(config, options, data);
        });
    }
    if (data) {
        exec(config, options, data)
    } else {
        self.loadData(exec)
    }
};

/**
 * build java project
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.webRoot - absolute path of web root
 * @param  {String}  config.viewRoot - absolute path of server template root
 * @param  {String}  config.proRoot - output project root
 * @param  {String}  config.projectType - application's project type
 * @param  {String}  config.templatePath - application's project template location
 * @param  {String}  config.templateDataPath - application's project template data location
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
    if (!config.templatePath) {
        return this.emit('debug', {
            message: "Please specify your project template's location"
        });
    }
    switch (config.projectType) {
        case 'hz.netease':
            config.modelOutPath = config.proRoot + 'app/src/main/hthttp-gen/';
            this._buildHZNetEaseProject(config);
            this.emit('debug', {
                message: "build models and requests..."
            });
            this.model(config, options, data);
            break;
        default:
            break;
    }
};
/**
 * build `hz.netease` java project
 * @param  {Object}  config - config object, see @pro._build
 * @return {Void}
 */
pro._buildHZNetEaseProject = function (config) {
    this.emit('debug', {
        data: [config.templatePath, config.proRoot],
        message: 'copy project files: from "%s" to "%s"'
    });
    _fs.cpdir(config.templatePath, config.proRoot, null);

    // default template data
    var tplData = {
        appPackage: 'com.netease.template',
        shortPackageName: 'template',
        applicationClass: 'YXApplication'
    };
    if (config.templateDataPath) {
        tplData = _util.file2json(config.templateDataPath);
    }
    var templatePkgPath = 'app/src/main/java/com/netease/template/'
    var tplPkgPath = config.proRoot + templatePkgPath;
    if (tplData.appPackage !== 'com.netease.template') {
        // copy template files
        tplPkgPath = util.format(
            '%sapp/src/main/java/%s/',
            config.proRoot,
            tplData.appPackage.replace(/\./g, '/')
        );
        this.emit('debug', {
            data: [tplPkgPath],
            message: 'make template package folder: %s'
        });
        _fs.mkdir(tplPkgPath);

        var oldTplPkgPath = config.proRoot + templatePkgPath;
        this.emit('debug', {
            data: [oldTplPkgPath, tplPkgPath],
            message: 'copy template files: from "%s" to "%s"'
        });
        _fs.cpdir(oldTplPkgPath, tplPkgPath, null);

        this.emit('debug', {
            data: [oldTplPkgPath],
            message: 'remove old template folder: %s'
        });
        _fs.rmdir(oldTplPkgPath);
    }
    if (tplData.applicationClass !== 'YXApplication') {
        // rename entry class file
        var applicationEntryClass = tplPkgPath + 'application/YXApplication.java';
        var newApplicationEntryClass = util.format(tplPkgPath + 'application/%s.java', tplData.applicationClass);
        this.emit('debug', {
            data: [tplData.applicationClass],
            message: 'renaming entry class file name to %s'
        });
        _fs.rename(applicationEntryClass, newApplicationEntryClass);
    }
    var templates = {};
    var files = _fs.lsfile(config.proRoot, function (fileName, file) {
        if (/^\.(java|gradle|xml)$/.test(path.extname(fileName))) {
            this.emit('debug', {
                data: [file],
                message: 'compile template %s'
            });
            // 有些文件如果有乱码，会导致编译异常
            try {
                templates[file] = swig.compileFile(file, {autoescape: false});
                // 如果 tokens.length === 1, 则说明没有需要替换的内容, 返回 false 以过滤掉该文件
                return templates[file].tokens.length !== 1;
            } catch (err) {
                this.emit('error', {
                    data: [err],
                    message: 'compile template error: %s'
                });
            }
            return false;
        }
    }.bind(this));

    files.forEach(function (file) {
        file = _path.normalize(file);
        var func = templates[file];
        if (!!func) {
            var content = func(tplData);
            this._output(file, content);
        }
    }, this);
};