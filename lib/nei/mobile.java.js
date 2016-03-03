/*
 * Mobile java builder
 * @module   nei/mobile.java
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
let url = require('url');
let swig = require('swig');
let MobileBuilder = require('./mobile');
let _util = require('../util/util');
let _fs = require('../util/file');
let _path = require('../util/path');
let logger = require('../util/logger');

class MobileJavaBuilder extends MobileBuilder {
    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
        super(config);
        this.dataTypeMapJava = {
            10000: {typeName: 'Object'},
            10001: {typeName: 'String'},
            10002: {typeName: 'double', listTypeName: 'Double'},
            10003: {typeName: 'boolean', listTypeName: 'Boolean'}
        };
    }

    /**
     * get prop java
     * @param  {Object} attr - attribute
     * @param  {Object} pkgs - packages object
     * @return {Object} prop
     */
    getPropJava(attr, pkgs) {
        let conf = this.dataTypeMapJava[attr.type];
        if (!conf) {
            let it = this.dataTypes[attr.type];
            conf = {
                typeName: it.name
            };
            // check enum type
            if (it.format === 1) {
                // for enum type
                conf = this.dataTypeMapJava['10001'];
                conf.isEnum = true;
            }
        }
        let prop = Object.assign(attr, conf);
        // check for Array
        if (prop.isArray == 1) {
            prop.typeName = 'List<' + (prop.listTypeName || prop.typeName) + '>';
            pkgs['java.util.List'] = 1;
        }
        prop.capName = prop.name.replace(/./, function ($1) {
            return $1.toUpperCase();
        });
        return prop;
    }

    /**
     * format java data type's property
     * @param  {Object} type - data type
     * @return {Object} type
     */
    formatPropJava(type) {
        // check properties
        if (!type.props) {
            type.props = [];
            type.pkgs = {};
            // format properties
            type.attrs.forEach((attr) => {
                type.props.push(this.getPropJava(attr, type.pkgs));
            });
        }
        return type;
    }

    /**
     * generator java model source code
     * @return {undefined}
     */
    exportModelJava() {
        let config = this.config;
        let modConfig = this.modConfig;
        // split data type
        let ret = this.splitDataType();
        let getFileName = function (typeName) {
            return util.format(
                '%s/%s.java',
                (config.resOut + modConfig.aPkg + '/' + modConfig.mPkg).replace(/\./g, '/'),
                typeName
            );
        };
        // build enum type
        ret.enums.forEach((type) => {
            let file = getFileName(type.name);
            let content = this.mergeTemplate(
                this.options.tplRoot + 'java/enum.java', {
                    conf: modConfig,
                    type: type
                }
            );
            this.output(file, content);
        });
        // build data type model
        ret.models.forEach((id) => {
            // ignore system type
            if (this.dataTypeMapJava[id]) {
                return;
            }
            let type = this.formatPropJava(this.dataTypes[id]);
            let file = getFileName(type.name);
            let content = this.mergeTemplate(
                this.options.tplRoot + 'java/model.java', {
                    conf: modConfig,
                    type: type
                }
            );
            this.output(file, content);
        });
    }

    /**
     * generator java httptask source code
     * @return {undefined}
     */
    exportRequestJava() {
        let config = this.config;
        let modConfig = this.modConfig || {};
        let pkgs = {};
        let getFileName = function (typeName) {
            return util.format(
                '%s/%s.java',
                (config.resOut + modConfig.aPkg + '/' + modConfig.htPkg).replace(/\./g, '/'),
                typeName
            );
        };
        let getWhiteSpace = function (name) {
            let wsArr = [];
            wsArr.length = name.length + 17;
            return wsArr.join(' ');
        };
        let getInputs = (itf) => {
            let inputs = [];
            if (this.isAnImportedDataType(itf.inputs)) {
                let dataTypeName = itf.inputs[0].datatypeName;
                inputs.push({
                    typeName: dataTypeName,
                    name: dataTypeName.replace(/./, function ($1) {
                        return $1.toLowerCase();
                    })
                });
                pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + dataTypeName] = 1;
            } else {
                itf.inputs.forEach((input, index) => {
                    let prop = this.getPropJava(input, pkgs);
                    if (index !== 0) {
                        prop.whiteSpace = getWhiteSpace(this.getReqClassName(itf));
                    }
                    inputs.push(prop);
                    // if it is not system type, import model package
                    if (!prop.isEnum && !this.dataTypeMapJava[input.type]) {
                        pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + input.typeName] = 1;
                    }
                });
            }
            return inputs;
        };
        let getParams = (itf) => {
            let method = this.getReqMethod(itf.method);
            let params = [];
            let inputContainer = /^(GET|HEAD)$/.test(method) ? 'mQueryParamsMap' : 'mBodyMap';
            let jsonObjectStr = 'com.alibaba.fastjson.JSONObject';
            let jsonArrayStr = 'com.alibaba.fastjson.JSONArray';
            let getParamValueExp = (param) => {
                if (param.isArray) {
                    pkgs[jsonArrayStr] = 1;
                    if (!this.dataTypeMapJava[param.type]) {
                        pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + param.typeName] = 1;
                    }
                    return 'JSONArray.toJSONString(' + param.name + ')';
                } else if (this.dataTypeMapJava[param.type]) {
                    switch (param.type) {
                        case 10002:
                        case 10003:
                            return this.dataTypeMapJava[param.type].listTypeName + '.toString(' + param.name + ')';
                        default:
                            return param.name;
                    }
                } else {
                    pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + param.typeName] = 1;
                    pkgs[jsonObjectStr] = 1;
                    return `JSONObject.toJSONString(${param.varName || param.name})`;
                }
            };
            itf.headers.forEach(function (header) {
                params.push({
                    container: 'mHeaderMap',
                    key: header.name,
                    desc: header.description,
                    valueExp: `"${header.defaultValue}"` // header's value is always `string`
                });
            });
            if (this.isAnImportedDataType(itf.inputs)) {
                let input = this.dataTypes[itf.inputs[0].datatypeId];
                input.typeName = itf.inputs[0].datatypeName;
                input.varName = input.name.replace(/./, function ($1) {
                    return $1.toLowerCase();
                });
                params.push({
                    container: inputContainer,
                    key: input.varName,
                    desc: input.description,
                    valueExp: inputContainer === 'mBodyMap' ? input.varName : getParamValueExp(input)
                });
                pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + input.typeName] = 1;
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
        let getOutputModel = (outputs) => {
            let getModel = (output) => {
                let type = this.dataTypeMapJava[output.type];
                if (!type) {
                    // is custom data type
                    pkgs[modConfig.aPkg + '.' + modConfig.mPkg + '.' + output.typeName] = 1;
                    type = {
                        typeName: output.typeName
                    }
                }
                return (type.listTypeName || type.typeName) + '.class';
            };
            if (this.isResultDataType(outputs)) {
                let result = this.getResultField(outputs);
                if (result) {
                    return getModel(result);
                }
            }
            if (this.isAnImportedDataType(outputs)) {
                let typeName = outputs[0].datatypeName;
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
        let baseReqPkg;
        let baseReqClass = (function () {
            if (modConfig.base.indexOf('.') !== -1) {
                // full path
                baseReqPkg = modConfig.base;
            } else {
                baseReqPkg = 'com.netease.hearttouch.hthttp' + '.' + modConfig.base
            }
            let paths = modConfig.base.split('.');
            return paths[paths.length - 1];
        })();
        // build requests
        this.data.interfaces.forEach((itf) => {
            pkgs = {
                'com.netease.hearttouch.hthttp.HttpMethod': 1 // default imported package
            };
            let method = this.getReqMethod(itf.method);
            let req = {
                baseClass: baseReqClass,
                inputs: getInputs(itf),
                name: this.getReqClassName(itf) + 'HttpTask',
                method: method,
                path: itf.path,
                desc: itf.description,
                outputModel: getOutputModel(itf.outputs),
                hasHost: !!url.parse(itf.path).host
            };
            let tpl = this.options.tplRoot + 'java/request.java';
            if (method === 'PUT') {
                pkgs['com.netease.hearttouch.hthttp.multipart.fileupload.http.BaseFileUploadHttpRequestTask'] = 1;
                pkgs['java.io.File'] = 1;
                pkgs['java.util.HashMap'] = 1;
                // put request is file upload
                tpl = this.options.tplRoot + 'java/request.put.java';
                req.mBoundary = (modConfig.aPkg.replace(/\./g, '_') + '_upload_file_boundary').toUpperCase();
            } else {
                pkgs[baseReqPkg] = 1;
                req.params = getParams(itf);
            }
            req.pkgs = Object.keys(pkgs).sort();
            let file = getFileName(req.name);
            let content = this.mergeTemplate(tpl, {
                conf: modConfig,
                req: req
            });
            this.output(file, content);
        });
    }

    /**
     * generate Java source code
     * @return {undefined}
     */
    model(data) {
        this.start(this.modelStart, data);
    }

    /**
     * start generating
     * @return {undefined}
     */
    modelStart() {
        let config = this.config;
        // command line e.g.: nei mobile 11029 -l java -o ../build/pro/
        // java 的请求基类名称默认为 `BaseHttpStringRequestTask`
        if (config.reqAbstract === 'HTBaseRequest') {
            config.reqAbstract = 'BaseHttpStringRequestTask';
        }
        this.initModConfig();
        config.resOut = _path.normalize(config.outputRoot + (config.resOut || '/app/src/main/hthttp-gen/') + '/');
        logger.log('debug', {
            data: [config.resOut],
            message: "make models and requests' dir: %s"
        });
        _fs.mkdir(config.resOut);
        logger.log('debug', {
            message: "build models and requests..."
        });
        this.sortData();
        this.diffJSONData();
        this.exportModelJava();
        this.exportRequestJava();
    }

    /**
     * build java project
     * @param  {boolean} [empty] - to build empty project(without models and requests) or not
     * @return {undefined}
     */
    buildStart(empty) {
        let config = this.config;
        if (!config.templatePath) {
            return logger.log('debug', {
                message: `Please specify your project template's location`
            });
        }
        switch (config.projectType) {
            case 'hz.netease':
                this.buildHZNetEaseProject();
                if (!empty) {
                    logger.log('debug', {
                        message: 'build models and requests...'
                    });
                    this.modelStart();
                }
                break;
            default:
                break;
        }
    }

    /**
     * build `hz.netease` java project
     * @return {undefined}
     */
    buildHZNetEaseProject() {
        let config = this.config;
        logger.log('debug', {
            data: [config.templatePath, config.outputRoot],
            message: 'copy project files: from "%s" to "%s"'
        });
        _fs.cpdir(config.templatePath, config.outputRoot, null);

        // default template data
        let tplData = {
            appPackage: 'com.netease.template',
            shortPackageName: 'template',
            applicationClass: 'YXApplication'
        };
        if (config.templateDataPath) {
            tplData = _util.file2json(config.templateDataPath);
        }
        let templatePkgPath = 'app/src/main/java/com/netease/template/';
        let tplPkgPath = config.outputRoot + templatePkgPath;
        if (tplData.appPackage !== 'com.netease.template') {
            // copy template files
            tplPkgPath = util.format(
                '%sapp/src/main/java/%s/',
                config.outputRoot,
                tplData.appPackage.replace(/\./g, '/')
            );
            logger.log('debug', {
                data: [tplPkgPath],
                message: 'make template package folder: %s'
            });
            _fs.mkdir(tplPkgPath);

            let oldTplPkgPath = config.outputRoot + templatePkgPath;
            logger.log('debug', {
                data: [oldTplPkgPath, tplPkgPath],
                message: 'copy template files: from "%s" to "%s"'
            });
            _fs.cpdir(oldTplPkgPath, tplPkgPath, null);

            logger.log('debug', {
                data: [oldTplPkgPath],
                message: 'remove old template folder: %s'
            });
            _fs.rmdir(oldTplPkgPath);
        }
        if (tplData.applicationClass !== 'YXApplication') {
            // rename entry class file
            let applicationEntryClass = tplPkgPath + 'application/YXApplication.java';
            let newApplicationEntryClass = util.format(tplPkgPath + 'application/%s.java', tplData.applicationClass);
            logger.log('debug', {
                data: [tplData.applicationClass],
                message: 'renaming entry class file name to %s'
            });
            _fs.rename(applicationEntryClass, newApplicationEntryClass);
        }
        let templates = {};
        let files = _fs.lsfile(config.outputRoot, (fileName, file) => {
            if (/^\.(java|gradle|xml)$/.test(path.extname(fileName))) {
                logger.log('debug', {
                    data: [file],
                    message: 'compile template %s'
                });
                // 有些文件如果有乱码，会导致编译异常
                try {
                    templates[file] = swig.compileFile(file, {autoescape: false});
                    // 如果 tokens.length === 1, 则说明没有需要替换的内容, 返回 false 以过滤掉该文件
                    return templates[file].tokens.length !== 1;
                } catch (err) {
                    logger.log('error', {
                        data: [err],
                        message: 'compile template error: %s'
                    });
                }
                return false;
            }
        });

        files.forEach((file) => {
            file = _path.normalize(file);
            let func = templates[file];
            if (func) {
                let content = func(tplData);
                this.output(file, content);
            }
        });
    }
}

module.exports = MobileJavaBuilder;

