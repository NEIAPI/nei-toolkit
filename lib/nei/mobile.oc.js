/*
 * Mobile OC builder
 * @module   nei/mobile.oc
 * @author   huntbao
 */
var path = require('path');
var util = require('util');
var url = require('url');
var swig = require('swig');
var _util = require('../util/util.js');
var _fs = require('../util/file.js');
var fs = require('fs');
var _path = require('../util/path.js');
var _pbx = require('./mobile.oc.pbx.js');

var TPL_ROOT = __dirname + '/mobile/template/';
var MobileOC = module.exports = require('../util/klass.js').create();
var pro = MobileOC.extend(require('./mobile.js'));

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
            typeName: this._modConfig.prefix + it.name
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
    var root;
    if (config.resOut) {
        root = config.resOut + 'Models/';
    } else {
        root = util.format('%sModels/', config.proRoot);
    }
    this.emit('debug', {
        data: [root],
        message: "remove Models folder: %s"
    });
    _fs.rmdir(root);
    var conf = this._modConfig || {};
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
                var file = root + conf.prefix + 'ModelEnums.' + ext;
                var content = this._mergeTemplate(
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
            var type = this._formatPropOC(this._types[id], conf);
            var prefix = root + conf.prefix + type.name + '.';
            arr.push(type.name);
            // output xx.m and xx.h
            ['m', 'h'].forEach(
                function (ext) {
                    var file = prefix + ext;
                    var content = this._mergeTemplate(
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
    var root;
    if (config.resOut) {
        root = config.resOut + 'Requests/';
    } else {
        root = util.format('%sRequests/', config.proRoot);
    }
    this.emit('debug', {
        data: [root],
        message: "remove Requests folder: %s"
    });
    _fs.rmdir(root);

    var conf = this._modConfig || {};
    var lowerCaseFirst = function (name) {
        return name.charAt(0).toLowerCase() + name.slice(1);
    };
    var getReqRes = function (outputs) {
        if (self._isResultDataType(outputs)) {
            var resultOutput = self._getResultField(outputs) || {};
            if (self._dataTypeMapOC[resultOutput.type]) {
                return {
                    model: null,
                    name: 'result'
                }
            }
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
        if (outputs.length > 1
            && self._hasOnlyOneCustomDataType(outputs, self._dataTypeMapOC)) {
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
            type.klses = {};
            var prop = self._getPropOC(type, input);
            Object.keys(type.klses).forEach(function (key) {
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
                    varName: lowerCaseFirst(header.name).replace(/-(.)/g,
                        function (match, group1) {
                            return group1.toUpperCase();
                        }
                    ),
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
                name: itf.name,
                className: this._getReqClassName(itf),
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
            var prefix = root + conf.prefix + req.className + '.';
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
 * @param  {Object} config - config object
 * @param  {String} config.proRoot - project root dir
 * @param  {String} config.lang - output language
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
    // command line e.g.: nei mobile 11029 -l oc -o ../build/pro/
    var self = this;
    self._setProductName(config);
    self.initModConfig(config);
    Object.assign(self._config, config);

    function exec(config, options, data) {
        config.resOut = _path.normalize(config.proRoot + (config.resOut || (config.productName + '/Network/')) + '/');
        self.emit('debug', {
            data: [config.resOut],
            message: "make models and requests' dir: %s"
        });
        _fs.mkdir(config.resOut);
        self.emit('debug', {
            message: "build models and requests..."
        });
        self._sortData(data);
        self._checkData(data, config, function (data) {
            self._exportModelOC(config, options, data);
            self._exportRequestOC(config, options, data);
            // if resource file is just changed, then need not to update project.pbxproj file
            if (config.action === 'build'
                || config.force
                || !self.isResourceInited
                || self.isResourceAdded
                || self.isResourceDeleted) {
                //update project.pbxproj file
                var dealResPath;
                if (config.action === 'mobile') {
                    dealResPath = config.resOut;
                }
                _pbx.update(config.productName, config.proRoot + config.productName, dealResPath);
            }
        });
    }

    if (data) {
        exec(config, options, data)
    } else {
        self.loadData(exec)
    }
};

/**
 * set product name by resOut, take it's first path
 * @param  {Object}  config
 * @return {Void}
 */
pro._setProductName = function (config) {
    config.productName = config.resOut ? config.resOut.split('/')[0] : '';
};

/**
 * build oc project
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
            var tplData = {};
            if (config.templateDataPath) {
                tplData = _util.file2json(config.templateDataPath);
            }
            config.tplData = tplData;
            this._setProductName(config);
            this._buildHZNetEaseProject(config);
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
    var self = this;
    var tplData = config.tplData;

    var productFolderPath = config.proRoot + config.productName + '/';
    this.emit('debug', {
        data: [productFolderPath],
        message: "remove folder: %s"
    });
    _fs.rmdir(productFolderPath);

    var xcodeprojFolderPath = config.proRoot + config.productName + '.xcodeproj/';
    this.emit('debug', {
        data: [xcodeprojFolderPath],
        message: "remove folder: %s"
    });
    _fs.rmdir(xcodeprojFolderPath);

    var templatePath = _path.normalize(config.templatePath + '/');
    this.emit('debug', {
        data: [templatePath, config.proRoot],
        message: 'copy project files: from "%s" to "%s"'
    });
    _fs.cpdir(templatePath, config.proRoot, null);

    var templates = {};
    var files = [];
    var rename = function (path) {
        var newPath = swig.render(path, {locals: tplData});
        if (newPath !== path) {
            self.emit('debug', {
                data: [path, newPath],
                message: 'rename "%s" to "%s"'
            });
            _fs.rename(path, newPath);
            return newPath;
        }
        return path;
    };
    _fs.walk(
        config.proRoot,
        function (filePath) {
            filePath = rename(filePath);
            self.emit('debug', {
                data: [filePath],
                message: 'compile template %s'
            });
            // some files has corrupted characters, compile error
            try {
                templates[filePath] = swig.compileFile(filePath, {autoescape: false});
                // if tokens.length === 1, there is nothing needed to be replaced
                if (templates[filePath].tokens.length !== 1) {
                    files.push(filePath);
                }
            } catch (err) {
                self.emit('error', {
                    data: [err],
                    message: 'compile template error: %s'
                });
            }
            return filePath;
        },
        rename
    );

    files.forEach(function (file) {
        file = _path.normalize(file);
        var func = templates[file];
        if (!!func) {
            var content = func(tplData);
            if (/^\.(pbxproj)$/.test(path.extname(file))) {
                // this file will read immediately, so use sync method
                this._outputSync(file, content);
            } else {
                this._output(file, content);
            }
        }
    }, this);
};
