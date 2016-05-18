/*
 * Mobile OC builder
 * @module   nei/mobile.oc
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
let url = require('url');
let swig = require('swig');
let fs = require('fs');
let MobileBuilder = require('./mobile');
let _util = require('../util/util');
let _fs = require('../util/file');
let _path = require('../util/path');
let PbxProj = require('./mobile.oc.pbx');
let logger = require('../util/logger');

class MobileOCBuilder extends MobileBuilder {
    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
        super(config);
        this.dataTypeMapOC = {
            10000: {typeName: 'id', refName: 'strong'},
            10001: {typeName: 'NSString', refName: 'copy'},
            10002: {typeName: 'CGFloat', arrName: 'NSNumber', refName: 'assign', noStar: !0},
            10003: {typeName: 'BOOL', arrName: 'NSNumber', refName: 'assign', noStar: !0}
        };
    }

    /**
     * get prop objective-c
     * @param  {object} type - data type
     * @param  {string} attr - attribute
     * @return {object} prop
     */
    getPropOC(type, attr) {
        let conf = this.dataTypeMapOC[attr.type];
        if (!conf) {
            let it = this.dataTypes[attr.type];
            conf = {
                refName: 'strong',
                typeName: this.modConfig.prefix + it.name
            };
            // check enum type
            if (it.format != 1) {
                // for Klass type
                type.klses[attr.name] = it.name;
            } else {
                // for enum type
                conf = this.dataTypeMapOC['10001'];
            }
            if (!type.hasEnum) {
                type.hasEnum = it.format == 1;
            }
        }
        let prop = _util.merge(attr, conf);
        // check for Array
        if (prop.isArray == 1) {
            prop.noStar = !1;
            prop.refName = 'strong';
            prop.typeName = 'NSArray<' + (prop.arrName || prop.typeName) + ' *>';
        }
        return prop;
    }

    /**
     * format objective-c property
     * @param  {object} type - data type
     * @param  {string} conf - config object
     * @return {object} type
     */
    formatPropOC(type, conf) {
        // check properties
        if (!type.props) {
            type.props = [];
            type.klses = {};
            // format properties
            type.attrs.forEach((attr) => {
                type.props.push(this.getPropOC(type, attr));
            });
            // for dictStr
            let arr = [];
            Object.keys(type.klses).forEach((name) => {
                let it = type.klses[name];
                arr.push(util.format('@"%s" : @"%s%s"', name, conf.prefix, it));
            });
            type.dictStr = arr.join(', ');
            // for baseStr
            arr = [];
            type.props.forEach((it) => {
                if (!type.klses[it.name]) {
                    arr.push(util.format('@"%s"', it.name));
                }
            });
            type.baseStr = arr.join(', ');
        }
        return type;
    }

    /**
     * generator objective-c model source code
     * @return {undefined}
     */
    exportModelOC() {
        let config = this.config;
        let root = config.resOut + 'Models/';
        logger.log('debug', {
            data: [root],
            message: "remove Models folder: %s"
        });
        _fs.rmdir(root);
        let conf = this.modConfig;
        // split data type
        let ret = this.splitDataType();
        // build enum type
        ret.enums.forEach((it) => {
            it.pairs = [];
            it.attrs.forEach((attr) => {
                it.pairs.push({
                    key: attr.vkey,
                    value: attr.name,
                    desc: attr.description
                });
            });
        });
        if (ret.enums.length > 0) {
            ['m', 'h'].forEach((ext) => {
                let file = root + conf.prefix + 'ModelEnums.' + ext;
                let content = this.mergeTemplate(
                    this.options.tplRoot + 'oc/enum.' + ext, {
                        conf: conf,
                        enums: ret.enums
                    }
                );
                this.output(file, content);
            });
        }
        // build data type model
        let arr = [];
        ret.models.forEach((id) => {
            // ignore system type
            if (this.dataTypeMapOC[id]) {
                return;
            }
            // check type
            let type = this.formatPropOC(this.dataTypes[id], conf);
            let prefix = root + conf.prefix + type.name + '.';
            arr.push(type.name);
            // output xx.m and xx.h
            ['m', 'h'].forEach((ext) => {
                let file = prefix + ext;
                let content = this.mergeTemplate(
                    this.options.tplRoot + 'oc/model.' + ext, {
                        conf: conf,
                        type: type
                    }
                );
                this.output(file, content);
            });
        });
        // output models.h
        arr.sort();
        let file = root + conf.prefix + conf.mheader + '.h';
        let content = this.mergeTemplate(
            this.options.tplRoot + 'oc/models.h', {
                conf: conf,
                list: arr
            }
        );
        this.output(file, content);
    }

    /**
     * generator objective-c request source code
     * @return {undefined}
     */
    exportRequestOC() {
        let config = this.config;
        let root = config.resOut + 'Requests/';
        logger.log('debug', {
            data: [root],
            message: "remove Requests folder: %s"
        });
        _fs.rmdir(root);

        let conf = this.modConfig;
        let lowerCaseFirst = (name) => {
            return name.charAt(0).toLowerCase() + name.slice(1);
        };
        let getReqRes = (outputs) => {
            if (this.isResultDataType(outputs)) {
                let resultOutput = this.getResultField(outputs);
                if (this.dataTypeMapOC[resultOutput.type]) {
                    return {
                        model: null,
                        name: resultOutput.name
                    }
                }
                return {
                    model: resultOutput.typeName,
                    name: resultOutput.name
                }
            }
            if (this.isAnImportedDataType(outputs)) {
                return {
                    model: outputs[0].datatypeName,
                    name: null
                }
            }
            if (outputs.length > 1
                && this.hasOnlyOneCustomDataType(outputs, this.dataTypeMapOC)) {
                let customDataType;
                outputs.forEach((output) => {
                    if (!this.dataTypeMapOC[output.type]) {
                        customDataType = output;
                    }
                });
                return {
                    model: customDataType.typeName,
                    name: customDataType.name
                }
            }
            if (outputs.length === 1) {
                let firstOutput = outputs[0];
                if (!this.dataTypeMapOC[firstOutput.type]) {
                    return {
                        model: firstOutput.typeName,
                        name: firstOutput.name
                    }
                }
            }
        };
        let getReqInfo = (inputs) => {
            let dataTypes = [];
            let models = {};
            let autoAddedName;
            let setDataTypeAndModel = (input, dataTypeId) => {
                let type = this.dataTypes[dataTypeId];
                type.klses = {};
                let prop = this.getPropOC(type, input);
                Object.keys(type.klses).forEach((key) => {
                    models[type.klses[key]] = 1;
                });
                dataTypes.push(prop);
            };
            if (this.isAnImportedDataType(inputs)) {
                let first = inputs[0];
                autoAddedName = lowerCaseFirst(first.datatypeName);
                setDataTypeAndModel({
                    name: autoAddedName,
                    type: first.datatypeId,
                    description: first.datatypeName
                }, first.datatypeId);
            } else {
                inputs.forEach((input) => {
                    setDataTypeAndModel(input, input.type);
                });
            }

            return {
                dataTypes: dataTypes,
                models: Object.keys(models).sort(),
                autoAddedName: autoAddedName
            }
        };
        let getReqHeaders = (headers) => {
            let constHeaders = [];
            let varHeaders = [];
            headers.forEach((header) => {
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
        let reqs = [];
        let req;
        // build requests
        this.data.interfaces.forEach((itf) => {
            let res = getReqRes(itf.outputs) || {};
            let reqInfo = getReqInfo(itf.inputs);
            let headers = getReqHeaders(itf.headers);
            let className = this.getReqClassName(itf, true);
            if (!className.endsWith('Request') && !className.endsWith('Task')) {
                className += `Request`;
            }
            req = {
                name: itf.name,
                className: className,
                method: this.getReqMethod(itf.method),
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
            let prefix = root + conf.prefix + req.className + '.';
            ['h', 'm'].forEach((ext) => {
                    let file = prefix + ext;
                    let content = this.mergeTemplate(
                        this.options.tplRoot + 'oc/request.' + ext, {
                            conf: conf,
                            req: req
                        }
                    );
                    this.output(file, content);
                }, this
            );
            reqs.push(req.className)
        });
        // output requests.h
        reqs.sort();
        let file = root + conf.prefix + conf.rheader + '.h';
        let content = this.mergeTemplate(
            this.options.tplRoot + 'oc/requests.h', {
                conf: conf,
                list: reqs
            }
        );
        this.output(file, content);
    }

    /**
     * generator objective-c source code
     * @return {undefined}
     */
    model(data) {
        this.start(this.modelStart, data);
    }

    modelStart() {
        // command line e.g.: nei mobile 11029 -l oc -o ../build/pro/
        let config = this.config;
        this.setProductName();
        this.initModConfig();
        config.resOut = _path.normalize(config.outputRoot + (config.resOut || (config.productName + '/Network/')) + '/');
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
        this.exportModelOC();
        this.exportRequestOC();
        // if no resource file is changed, then need not to update project.pbxproj file
        if (config.action === 'build'
            || config.force
            || !this.isResourceInited
            || this.isResourceAdded
            || this.isResourceDeleted) {
            // update project.pbxproj file
            let dealResPath;
            if (config.updateProject !== true || config.action === 'mobile') {
                dealResPath = config.resOut;
            }
            let projectPath = config.outputRoot + config.productName;
            let projectFilePath = projectPath + '.xcodeproj/project.pbxproj';
            // check if pbxproj file exists
            if (_fs.exist(projectFilePath)) {
                let pbxProj = new PbxProj(config.productName, projectPath, projectFilePath);
                pbxProj.update(dealResPath);
            } else {
                logger.log('info', {
                    message: `project file ${projectFilePath} not exists`
                });
            }
        }
    }

    /**
     * set product name by resOut, take it's first path
     * @return {undefined}
     */
    setProductName() {
        let config = this.config;
        config.productName = config.resOut ? config.resOut.split('/')[0] : '';
    }

    /**
     * build oc project
     * @param  {boolean} [empty] - to build empty project(without models and requests) or not
     * @return {undefined}
     */
    buildStart(empty) {
        switch (this.config.projectType) {
            case 'hz.netease':
                this.tplData = Object.assign({}, _util.file2json(this.config.templateDataPath, true), this.config[Object.getOwnPropertySymbols(this.config)[0]]);
                this.setProductName();
                this.buildHZNetEaseProject();
                if (!empty) {
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
        let tplData = this.tplData;
        let config = this.config;
        let productFolderPath = config.outputRoot + config.productName + '/';
        logger.log('debug', {
            data: [productFolderPath],
            message: "remove folder: %s"
        });
        _fs.rmdir(productFolderPath);

        let xcodeprojFolderPath = config.outputRoot + config.productName + '.xcodeproj/';
        logger.log('debug', {
            data: [xcodeprojFolderPath],
            message: "remove folder: %s"
        });
        _fs.rmdir(xcodeprojFolderPath);

        let templatePath = _path.normalize(config.templatePath + '/');
        logger.log('debug', {
            data: [templatePath, config.outputRoot],
            message: 'copy project files: from "%s" to "%s"'
        });
        _fs.cpdir(templatePath, config.outputRoot, null);

        let templates = {};
        let files = [];
        let rename = function (path) {
            let newPath = swig.render(path, {locals: tplData});
            if (newPath !== path) {
                logger.log('debug', {
                    data: [path, newPath],
                    message: 'rename "%s" to "%s"'
                });
                _fs.rename(path, newPath);
                return newPath;
            }
            return path;
        };
        _fs.walk(
            config.outputRoot,
            (filePath) => {
                filePath = rename(filePath);
                logger.log('debug', {
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
                    logger.log('error', {
                        data: [err],
                        message: 'compile template error: %s'
                    });
                }
                return filePath;
            },
            rename
        );

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

module.exports = MobileOCBuilder;


