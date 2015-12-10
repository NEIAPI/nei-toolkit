/*
 * Mobile Builder
 * @module   nei/mobile
 * @author   genify(caijf@corp.netease.com)
 */
var path = require('path'),
    util = require('util'),
    _util  = require('../util/util.js');
// template root
var TPL_ROOT = __dirname+'/mobile/template/';
// mobile build
var Mobile = module.exports
    = require('../util/klass.js').create();
var pro = Mobile.extend(require('./builder.js'));
/**
 * filter config field from input
 * @param  {Object} config - config data
 * @return {Object} result will be save to config file
 */
pro._filter = function(config){
    this._super(config);
    // TODO
};
/**
 * init template
 * @return {Void}
 */
pro._template = function(){
    this._super();
    this._parseTemplate(TPL_ROOT);
};
/**
 * format config data
 * @protected
 * @param  {Object} data - config data
 * @return {Void}
 */
pro._format = function(data){
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
pro._build = function(config,options,data){
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
pro._update = function(config,options,data){
    // TODO
};
/**
 * do something before build done
 * @param  {Object} config - nei config will be outputted
 * @return {Void}
 */
pro._beforeDone = function(config){
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
pro.model = function(config){
    // check language
    var func = {
        oc:this._modelOC,
        java:this._modelJava
    }[
        config.lang
    ];
    if (!func){
        this.emit('error',{
            data:[config.lang],
            message:'not supported language %s'
        });
        this.emit('done');
        return;
    }
    // save config
    var time = new Date();
    this._modConf = {
        prefix:config.namePrefix||'',
        base:config.reqAbstract||'',
        model:config.modelAbstract||'',
        rheader:config.reqHeaders||'',
        mheader:config.modelHeaders||'',
        aPkg:config.appPackage||'',
        mPkg:config.modelPackage||'',
        htPkg:config.reqPackage||'',
        author:config.author,
        year:time.getFullYear(),
        month:time.getMonth()+1,
        day:time.getDate()
    };
    // load config from nei
    this._loadConfig(func);
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
// map data type of objective-c
pro._dataTypeMapOC = {
    10000:{typeName:'id',refName:'strong'},
    10001:{typeName:'NSString',refName:'copy'},
    10002:{typeName:'CGFloat',arrName:'NSNumber',refName:'assign',noStar:!0},
    10003:{typeName:'BOOL',arrName:'NSNumber',refName:'assign',noStar:!0}
};
/**
 * get prop objective-c
 * @param  {Object} type - data type
 * @param  {String} attr - attribute
 * @return {Object} prop
 */
pro._getPropOC = function (type, attr) {
    var conf = this._dataTypeMapOC[attr.type];
    if (!conf){
        var it = this._types[attr.type];
        conf = {
            refName:'strong',
            typeName:this._modConf.prefix+it.name
        };
        // check enum type
        if (it.format!=1){
            // for Klass type
            type.klses[attr.name] = it.name;
        }else{
            // for enum type
            conf = this._dataTypeMapOC['10001'];
        }
        if (!type.hasEnum){
            type.hasEnum = it.format==1;
        }
    }
    var prop = _util.merge(attr, conf);
    // check for Array
    if (prop.isArray==1){
        prop.noStar = !1;
        prop.refName = 'strong';
        prop.typeName = 'NSArray<'+(prop.arrName||prop.typeName)+' *>';
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
    if (!type.props){
        type.props = [];
        type.klses = {};
        // format properties
        type.attrs.forEach(
            function(attr){
                type.props.push(this._getPropOC(type, attr));
            },this
        );
        // for dictStr
        var arr = [];
        Object.keys(type.klses).forEach(function(name){
            var it = type.klses[name];
            arr.push(util.format('@"%s" : @"%s%s"',name,conf.prefix,it));
        });
        type.dictStr = arr.join(', ');
        // for baseStr
        arr = [];
        type.props.forEach(function(it){
            if (!type.klses[it.name]){
                arr.push(util.format('@"%s"',it.name));
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
pro._exportModelOC =  function(config,options,data){
    var root = config.proRoot+'Model/',
        conf = this._modConf||{};
    // split data type
    var ret = this._splitDataType();
    // build enum type
    ret.enums.forEach(function(it){
        it.pairs = [];
        it.attrs.forEach(function(attr){
            it.pairs.push({
                key:attr.vkey,
                value:attr.name,
                desc:attr.description
            });
        });
    });
    if (ret.enums.length>0){
        ['m','h'].forEach(
            function(ext){
                var file = root+'Enum.'+ext,
                    content = this._mergeTemplate(
                        TPL_ROOT+'oc/enum.'+ext,{
                            conf:conf,
                            enums:ret.enum
                        }
                    );
                this._output(file,content);
            },this
        );
    }
    // build data type model
    var arr = [];
    ret.models.forEach(
        function(id){
            // ignore system type
            if (!!this._dataTypeMapOC[id]){
                return;
            }
            // check type
            var type = this._formatPropOC(this._types[id],conf),
                prefix = root+conf.prefix+type.name+'.';
            arr.push(type.name);
            // output xx.m and xx.h
            ['m','h'].forEach(
                function(ext){
                    var file = prefix+ext,
                        content = this._mergeTemplate(
                            TPL_ROOT+'oc/model.'+ext,{
                                conf:conf,
                                type:type
                            }
                        );
                    this._output(file,content);
                },this
            );
        },this
    );
    // output models.h
    arr.sort();
    var file = root+conf.prefix+conf.mheader+'.h',
        content = this._mergeTemplate(
            TPL_ROOT+'oc/models.h',{
                conf:conf,
                list:arr
            }
        );
    this._output(file,content);
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
pro._exportRequestOC = function(config,options,data){
    var self = this;
    var root = config.proRoot + 'Request/';
    var conf = this._modConf || {};
    var isAnImportedDataType = function (params) {
        var datatypeId;
        for(var i = 0, l = params.length; i < l; i++) {
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
    var hasOnlyOneCustomDataType = function (params) {
        var customDataType;
        for(var i = 0, l = params.length; i < l; i++) {
            if (params[i].datatypeId) {
                return false;
            }
            if (!self._dataTypeMapOC[params[i].type]) {
                if (customDataType) {
                    return false;
                }
                customDataType = params[i].type;
            }
        }
        return !!customDataType;
    };
    var getReqName = function (itf) {
        var name = itf.name;
        if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
            return name;
        }
        // name is invalid for class name, using path's camelCase format
        return itf.path.replace(/\/(.)/g, function (match, group1) {
            return group1.toUpperCase();
        });
    };
    var getReqRes = function (outputs) {
        var firstOutput = outputs[0];
        if (!firstOutput) {
            return {}
        }
        var dataTypeName = firstOutput.datatypeName;
        if (dataTypeName) {
            // imported datatype
            var isResultDataModel = dataTypeName === 'ResultData';
            var resultOutput;
            if (isResultDataModel) {
                outputs.forEach(function (output) {
                    if (output.name === 'result') {
                        resultOutput = output;
                    }
                })
            } else {
                if (isAnImportedDataType(outputs)) {
                    return {
                        model: dataTypeName,
                        name: null
                    }
                }
            }
            if (resultOutput) {
                self.emit('debug',{
                    data: [resultOutput.typeName],
                    message: 'Build OC request: output is "ResultData", "result" model is "%s"'
                });
            } else {
                self.emit('error',{
                    message: 'Build OC request: output is "ResultData", but it has no "result" field'
                });
                return {};
            }
            return {
                model: resultOutput.typeName,
                name: isResultDataModel ? 'result' : null
            }
        }
        if (outputs.length > 1 && hasOnlyOneCustomDataType(outputs)) {
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
            if (!self._dataTypeMapOC[firstOutput.type]) {
                return {
                    model: firstOutput.typeName,
                    name: firstOutput.name
                }
            }
        }
        self.emit('debug',{
            message: 'Build OC request: outputs does not follow the Gen Rules'
        });
        return {};
    };
    var getReqInfo = function (inputs) {
        var dataTypes = [];
        var models = [];
        var autoAddedName;
        var setDataTypeAndModel = function (input, dataTypeId) {
            var type = self._types[dataTypeId];
            var prop = self._getPropOC(type, input);
            type.klses && Object.keys(type.klses).forEach(function (key) {
                models.push(type.klses[key]);
            });
            dataTypes.push(prop);
        };
        if (isAnImportedDataType(inputs)) {
            var first = inputs[0];
            var getTypeName = function (name) {
                return name.charAt(0).toLowerCase() + name.slice(1);
            };
            autoAddedName = getTypeName(first.datatypeName);
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
        function onlyUnique(value, index, arr) {
            return arr.indexOf(value) === index;
        }
        return {
            dataTypes: dataTypes,
            models: models.sort().filter(onlyUnique),
            autoAddedName: autoAddedName
        }
    };
    var reqs = [];
    var req;
    // build requests
    data.interfaces.forEach(
        function (itf) {
            var res = getReqRes(itf.outputs);
            var reqInfo = getReqInfo(itf.inputs);
            req = {
                name: getReqName(itf),
                method: this._parseReqMethod(itf.method),
                url: itf.path,
                description: itf.description,
                reqDataTypes: reqInfo.dataTypes,
                reqModels: reqInfo.models,
                reqAutoAddedName: reqInfo.autoAddedName,
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
pro._modelOC = function(config,options,data){
    this._exportModelOC(config,options,data);
    this._exportRequestOC(config,options,data);
};
// map data type of java
pro._dataTypeMapJava = {
    10000: {typeName: 'Object'},
    10001: {typeName: 'String'},
    10002: {typeName: 'double'},
    10003: {typeName: 'boolean'}
};
/**
 * get prop java
 * @param  {Object} type - data type
 * @param  {String} attr - attribute
 * @return {Object} prop
 */
pro._getPropJava = function (type, attr) {
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
        type.pkgs['java.util.List'] = 1;
        prop.typeName = 'List<' + (prop.arrName || prop.typeName) + '>';
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
    if (!type.props){
        type.props = [];
        type.pkgs = {};
        // format properties
        type.attrs.forEach(function (attr) {
            type.props.push(this._getPropJava(type, attr));
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
    var root = config.proRoot + 'Model/';
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
pro._exportHttpTaskJava = function (config, options, data) {
    var self = this;
    var root = config.proRoot + 'HttpTasks/';
    var conf = this._modConf || {};
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
        itf.inputs.forEach(function (input, index) {
            if (index !== 0) {
                input.whiteSpace = getWhiteSpace(itf.name);
            }
            inputs.push(input);
        });
        return inputs;
    };
    var req;
    // build requests
    data.interfaces.forEach(
        function (itf) {
            req = {
                name: itf.name + 'HttpTask',
                method: this._parseReqMethod(itf.method),
                url: itf.path,
                description: itf.description,
                inputs: getInputs(itf),
                headers: itf.headers
            };
            var file = getFileName(itf.name);
            var content = this._mergeTemplate(
                TPL_ROOT + 'java/request.java', {
                    conf: conf,
                    req: req
                }
            );
            this._output(file, content);
        }, this
    );
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
pro._modelJava = function(config,options,data){
    this._exportModelJava(config, options, data);
    this._exportHttpTaskJava(config, options, data);
};