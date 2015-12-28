/*
 * Mobile OC builder
 * @module   nei/mobile.oc
 * @author   huntbao
 */
var path = require('path');
var util = require('util');
var url = require('url');
var _util = require('../util/util.js');
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
    var root = util.format('%s%s/Models/', config.proRoot, config.id);
    conf = this._modConfig || {};
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
    var root = util.format('%s%s/Requests/', config.proRoot, config.id);
    var conf = this._modConfig || {};
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
 * @param  {Object} config - config object
 * @param  {String} config.lang   - output language
 * @param  {String} config.author - author name
 * @param  {String} config.namePrefix  - Class Name Prefix
 * @param  {String} config.reqAbstract - Request Class Abstract Name
 * @return {Void}
 */
pro.model = function (config) {
    // command line e.g.: nei mobile 11029 -l oc -o ../build/pro/
    var self = this;
    self.initModConfig(config);
    self.loadData(function (config, options, data) {
        self._sortData(data);
        self._checkData(data, config, function (data) {
            self._exportModelOC(config, options, data);
            self._exportRequestOC(config, options, data);
        });
    });
};