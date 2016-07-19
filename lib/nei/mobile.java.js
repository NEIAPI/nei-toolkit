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
        //解决 mobile 测试用例不通过问题 ,加在这里而不是直接
        // 修改 build.js  compileTemplate() 是因为不知道修改这个让此时不compile,对其他模块有什么影响
        // by Icy
        // this.options.tplRoot = _path.absolute(
        //     './template/java/', __dirname + '/'
        // )
        this.dataTypeMapJava = {
            10000: {typeName: 'Object', listTypeName: 'Object'},
            10001: {typeName: 'String', listTypeName: 'String'},
            10002: {typeName: 'Double', listTypeName: 'Double'},
            10003: {typeName: 'Boolean', listTypeName: 'Boolean'}
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
                typeName: it.name,
                realTypeName: it.name
            };
            if (it.format === 1) {
                // 枚举类型
                conf = this.dataTypeMapJava['10001'];
                conf.isEnum = true;
            } else if (it.format === 2) {
                // 如果是数组, 则取数组元素的类型
                conf.typeName = this.getElementType(this.dataTypes[it.id]);
            }
        }
        let prop = Object.assign(attr, conf);
        // check for Array
        if (prop.isArray == 1) {
            let typeName = prop.listTypeName || prop.typeName;
            prop.typeName = `${typeName}[]`;
            // 数组或者多维数组, 真正的类型还是 typeName, 请求中导入的模型包是 realTypeName
            // Point[], Point[][]等, 导入的模型为 Point
            prop.realTypeName = prop.realTypeName || typeName;
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
        let ret = this.splitDataType();
        let getFileName = function (typeName) {
            let filePath = (config.resOut + modConfig.aPkg + '/' + modConfig.mPkg).replace(/\./g, '/');
            return `${filePath}/${typeName}.java`;
        };
        // 枚举类型
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

        let req = {
            baseModel: null
        };
        //生成baseModel
        if (modConfig.baseModel) {
            let baseModelClass = (function () {
                let paths = modConfig.baseModel.split('.');
                return paths[paths.length - 1];
            })();

            req.baseModel = baseModelClass;

            let baseFileName = getFileName(req.baseModel);
            let baseModelContent = this.mergeTemplate(`${this.options.tplRoot}java/base.model.template.java`, {
                conf: modConfig,
                req: req
            });

            this.output(baseFileName, baseModelContent);
        } 

        // `哈希` 或者 `数组` 类型
        ret.models.forEach((id) => {
            // 忽略系统类型
            if (this.dataTypeMapJava[id]) {
                return;
            }

            let type = this.formatPropJava(this.dataTypes[id]);
            let file = getFileName(type.name);
            let content = this.mergeTemplate(
                `${this.options.tplRoot}java/model.java`, {
                    conf: modConfig,
                    type: type,
                    req: req
                }
            );
            this.output(file, content);
        });
    }

    /**
     * 获取元素的类型
     * @param  {Object} element - 元素
     * @param  {Object} [customTypeMap] - 在递归遍历获取元素类型的过程中, 用来保存最终的自定义类型的名称
     * @param  {Boolean} [isArrayElement] - 元素是否为数组元素
     * @return {Object} type
     */
    getElementType(element, customTypeMap, isArrayElement) {
        customTypeMap = customTypeMap || {};
        if (element.isArray) {
            let arrDataType = this.dataTypes[element.type];
            return `${this.getElementType(arrDataType, customTypeMap, true)}[]`;
        } else {
            let type = this.dataTypeMapJava[element.id];
            if (type) {
                // 原始类型
                if (isArrayElement) {
                    // 数组中的元素类型
                    return type.listTypeName;
                } else {
                    // 非数组中的元素类型
                    return type.typeName;
                }
            } else {
                // 自定义类型, 枚举类型不处理
                // todo: 这里有点混乱
                if (typeof(element.format) === 'undefined') {
                    // element 是自定义类型或者基本类型
                    if (!element.isSysType) {
                        // 保存自定义类型名称到传入的 map 对象
                        customTypeMap.name = element.typeName;
                    }
                    return `${element.typeName}`;
                }
                if (element.format === 0) {
                    // 哈希对象, element 是数组中的元素了
                    // 保存自定义类型名称到传入的 map 对象
                    customTypeMap.name = element.name;
                    return `${element.name}`;
                } else if (element.format === 2) {
                    // 数组类型
                    let arrDataType = this.dataTypes[element.subtype];
                    return `${this.getElementType(arrDataType, customTypeMap, true)}[]`;
                }
            }
        }
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
            let filePath = (config.resOut + modConfig.aPkg + '/' + modConfig.htPkg).replace(/\./g, '/');
            return `${filePath}/${typeName}.java`;
        };
        let getWhiteSpace = function (name) {
            let wsArr = [];
            wsArr.length = name.length + 9;
            return wsArr.join(' ');
        };
        let getReqClassName = (itf) => {
            let name = this.getReqClassName(itf, true);
            if (!name.endsWith('Request') && !name.endsWith('Task')) {
                name += `Request`;
            }
            return name;
        }
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
                pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${dataTypeName}`] = 1;
            } else {
                itf.inputs.forEach((input, index) => {
                    let prop = this.getPropJava(input, pkgs);
                    if (index !== 0) {
                        prop.whiteSpace = getWhiteSpace(getReqClassName(itf));
                    }
                    inputs.push(prop);
                    // if it is not system type, import model package
                    if (!prop.isEnum && !this.dataTypeMapJava[input.type]) {
                        pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${prop.realTypeName}`] = 1;
                    }
                });
            }
            return inputs;
        };
        let getParams = (itf) => {
            let method = this.getReqMethod(itf.method);
            let params = [];
            let inputContainer = /^(GET|HEAD)$/.test(method) ? 'queryMap' : 'bodyMap';
            let arrayUtilPkgStr = 'java.util.Arrays';
            let getParamValueExp = (param) => {
                if (param.isArray) {
                    // 字段是数组
                    pkgs[arrayUtilPkgStr] = 1;
                    if (!this.dataTypeMapJava[param.type]) {
                        pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${param.realTypeName}`] = 1;
                    }
                    return `Arrays.deepToString(${param.name})`;
                } else if (this.dataTypeMapJava[param.type]) {
                    switch (param.type) {
                        case 10002:
                        case 10003:
                            return `${param.name}.toString()`;
                        default:
                            return param.name;
                    }
                } else {
                    // 字段是自定义类型, 但这个自定义类型是数组
                    if (param.typeName.indexOf('[]') > -1) {
                        pkgs[arrayUtilPkgStr] = 1;
                        return `Arrays.deepToString(${param.varName || param.name})`;
                    }
                    // 自定义类型为哈希表
                    pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${param.typeName}`] = 1;
                    return `${param.varName || param.name}.toString()`;
                }
            };
            itf.headers.forEach(function (header) {
                params.push({
                    container: 'headMap',
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
                    valueExp: getParamValueExp(input)
                });
                pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${input.typeName}`] = 1;
            } else {
                itf.inputs.forEach(function (input) {
                    params.push({
                        container: inputContainer,
                        key: input.name,
                        desc: input.description,
                        valueExp: getParamValueExp(input)
                    });
                });
            }
            return params;
        };
        let getOutputModel = (outputs) => {
            if (this.isResultDataType(outputs)) {
                let result = this.getResultField(outputs);
                if (result) {
                    let customDataTypeMap = {};
                    let elementType = this.getElementType(result, customDataTypeMap);
                    if (customDataTypeMap.name) {
                        pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${customDataTypeMap.name}`] = 1;
                    }
                    return `${elementType}.class`;
                }
            }
            if (this.isAnImportedDataType(outputs)) {
                let typeName = outputs[0].datatypeName;
                pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${typeName}`] = 1;
                return `${typeName}.class`;
            }
            if (outputs.length === 1) {
                let customDataTypeMap = {};
                let elementType = this.getElementType(outputs[0], customDataTypeMap);
                if (customDataTypeMap.name) {
                    pkgs[`${modConfig.aPkg}.${modConfig.mPkg}.${customDataTypeMap.name}`] = 1;
                }
                return `${elementType}.class`;
            }
            if (outputs.length > 1) {
                return 'Object.class';
            }

            //新需求,如果返回值为空,返回的modelClass 为String
            return 'String.class'
            //return 'null';
        };
        let baseReqClass = (function () {
            let paths = modConfig.base.split('.');


            return paths[paths.length - 1];
        })();


        let importBaseReqPkg = () => {
            // 如果 BaseRequest 和生成的请求在同一个包内，不需要import
            let reqPkg = `${modConfig.aPkg}.${modConfig.htPkg}`;
            let baseReqPkgPaths = modConfig.base.split('.');
            baseReqPkgPaths.pop();
            if (baseReqPkgPaths.join('.') !== reqPkg) {
                pkgs[modConfig.base] = 1;
            }
        }
        // build requests
        this.data.interfaces.forEach((itf) => {
            pkgs = {
                'com.netease.hearttouch.hthttp.operation.HttpMethod': 1 // 固定要导入的包
            };
            importBaseReqPkg();
            let method = this.getReqMethod(itf.method);
            let name = getReqClassName(itf);
            let req = {
                baseClass: baseReqClass,
                inputs: getInputs(itf),
                name: name,
                method: method,
                path: itf.path,
                desc: itf.description,
                outputModel: getOutputModel(itf.outputs),
                hasHost: !!url.parse(itf.path).host

            };
            let tpl = `${this.options.tplRoot}java/request.java`;
            req.params = getParams(itf);
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
        this.initModConfig();
        config.resOut = _path.normalize(config.outputRoot + config.resOut + '/');
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
        
      
        if (/^[A-Za-z0-9\.]+$/.test(config.reqAbstract) && /\./.test(config.reqAbstract)) {
            // 指定了合法的请求基类(全路径, 中间带点号)才生成请求文件
            this.exportRequestJava();
        } else {
            logger.log('debug', {
                message: `请求基类 "${config.reqAbstract}" 不合法, 请输入基类的全路径`
            });
        }
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
            tplData = Object.assign({}, _util.file2json(config.templateDataPath, true), config[Object.getOwnPropertySymbols(config)[0]]);
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

