/*
 * 格式化 NEI 上的源数据
 * @author huntbao
 */
'use strict';
let path = require('path');
let neiDbConst = require('../fb-modules/config/db.json');
let logger = require('../util/logger');

module.exports = {
    /**
     * 格式化 nei 数据源
     * @param  {object} neids - nei 上的数据源
     */
    format(neids) {
        this.neids = neids;
        let ds = {
            project: {},
            spec: {},
            views: [],
            templates: [],
            interfaces: [],
            datatypes: [],
            datatypeEnums: []
        };
        let varmaps = this.getVarmaps(neids.specs[0].varmaps);
        let getType = (type) => {
            return varmaps[type] || type;
        };
        let getParams = (params) => {
            return params.map((item) => {
                let arrDim = item.isArray ? 1 : 0;
                let datatype = this.neids.datatypes.find((it) => {
                    return it.id === item.type;
                });
                let datatypeInfo = this.getDatatype(datatype);
                return {
                    name: item.name,
                    type: getType(datatypeInfo.typeName),
                    arrDim: datatypeInfo.dim + arrDim,
                    defaultValue: item.defaultValue,
                    genExp: item.genExpression,
                    description: item.description
                }
            });
        };
        let getKVs = (params) => {
            return params.map((item) => {
                return {
                    key: item.name,
                    value: item.defaultValue,
                    description: item.description || ''
                }
            });
        };
        let getTemplate = (item) => {
            let tpl = {
                name: item.name,
                path: item.path,
                tag: item.tag,
                description: item.description,
                group: {
                    name: item.group.name,
                    description: item.group.description
                },
                params: getParams(item.params || [])
            };
            // 处理 path, 如果没有后缀, 加上规范中指定的模板扩展名
            let extname = path.extname(tpl.path);
            if (!extname && ds.spec.viewExt) {
                tpl.path += `.${ds.spec.viewExt}`;
            }
            // 对应的 css 和 js 等资源文件会用到这个值
            tpl.filename = this.getFileNameByPath(tpl.path);
            return tpl;
        };
        // 项目数据
        ds.project = {
            id: neids.project.id,
            name: neids.project.name,
            description: neids.project.description,
            creator: {
                email: neids.project.creator.email,
                name: neids.project.creator.realname
            }
        };
        // 规范数据
        let spec = neids.specs[0].spec;
        ds.spec = {
            name: spec.name,
            description: spec.description,
            document: spec.document,
            language: this.getSpecLanguage(spec.language)
        };
        if (spec.attributes) {
            Object.assign(ds.spec, {
                engine: this.getSpecEngine(spec.attributes.engine),
                viewExt: spec.attributes.viewExtension
            });
        }
        // 被页面引用的页面模板id列表
        let usedTemplateIds = {};
        // 视图
        ds.views = neids.pages.map((item) => {
            let tpls = [];
            item.templates.forEach(function (tpl) {
                usedTemplateIds[tpl.id] = 1;
                tpls.push(getTemplate(tpl));
            });
            if (!item.className) {
                logger.log('warn', {
                    data: [item.path, item.name],
                    message: '没有为页面指定类名: %s, %s'
                });
            }
            return {
                name: item.name,
                path: item.path,
                tag: item.tag,
                title: item.title,
                description: item.description,
                className: item.className,
                group: {
                    name: item.group.name,
                    description: item.group.description
                },
                templates: tpls
            }
        });
        // 页面模板, 只处理被页面引用的模板
        neids.templates.forEach((item) => {
            if (usedTemplateIds[item.id]) {
                let tpl = getTemplate(item);
                ds.templates.push(tpl);
            }
        });
        // 异步接口
        ds.interfaces = neids.interfaces.map((item) => {
            if (!item.className) {
                logger.log('warn', {
                    data: [item.method, item.path, item.name],
                    message: '没有为接口指定类名: %s:%s, %s'
                });
            }
            let outputModel = this.getOutputModel(item.params.outputs);
            let nItem = {
                name: item.name,
                description: item.description,
                tag: item.tag,
                path: item.path,
                method: item.method,
                className: item.className,
                group: {
                    name: item.group.name,
                    description: item.group.description
                },
                inputs: null,
                outputs: null,
                outputModel: outputModel.typeName,
                outputModelArrDim: outputModel.dim,
                reqHeaders: null,
                reqFormat: item.reqFormat,
                resFormat: item.resFormat
            };
            nItem.inputs = getParams(item.params.inputs);
            nItem.outputs = getParams(item.params.outputs);
            if (nItem.outputModel) {
                nItem.outputModel = getType(nItem.outputModel);
            }
            nItem.reqHeaders = getKVs(item.params.reqHeaders);
            return nItem;
        });
        neids.datatypes.forEach((item) => {
            if (item.type === neiDbConst.MDL_TYP_NORMAL
                && !item.name.startsWith('_')
                && item.format === neiDbConst.MDL_FMT_HASH) {
                let foundVar = item.params.find((item) => {
                    return item.type === neiDbConst.MDL_SYS_VARIABLE;
                });
                if (!foundVar) {
                    // 数据模型, 只处理可见的哈希类型, 并且开始字符不是下划线, 并且没有可变类型的字符
                    ds.datatypes.push({
                        format: neiDbConst.MDL_FMT_HASH,
                        name: item.name,
                        description: item.description,
                        tag: item.tag,
                        group: {
                            name: item.group.name,
                            description: item.group.description
                        },
                        fields: getParams(item.params)
                    });
                }
            } else if (item.format === neiDbConst.MDL_FMT_ENUM) {
                let enumDT = {
                    format: neiDbConst.MDL_FMT_ENUM,
                    name: item.name,
                    // 取第一个成员的类型
                    type: getType(item.params[0].typeName),
                    members: getKVs(item.params)
                };
                ds.datatypes.push(enumDT);
                // 所有的枚举类型
                ds.datatypeEnums.push(enumDT);
            }
        });
        return ds;
    },

    /**
     * 合并变量映射规则
     * @param  {array} varmaps - 变量映射规则列表
     * @return  {object} - 变量映射规则
     */
    getVarmaps(varmaps) {
        let specVarmaps = {};
        let progroupVarmaps = {};
        let projectVarmaps = {};
        varmaps.forEach((item) => {
            switch (item.parentType) {
                case neiDbConst.SPC_MAP_SPEC:
                    specVarmaps[item.orgName] = item.varName;
                    break;
                case neiDbConst.SPC_MAP_PROGROUP:
                    progroupVarmaps[item.orgName] = item.varName;
                    break;
                case neiDbConst.SPC_MAP_PROJECT:
                    projectVarmaps[item.orgName] = item.varName;
                    break;
            }
        });
        // 项目的规则 > 项目组的规则 > 规范的规则
        return Object.assign({}, specVarmaps, progroupVarmaps, projectVarmaps);
    },

    /**
     * 获取输出参数的类型, 后端在接口代码中需要该信息
     *
     * 根据返回值的类型，需返回不同的值，规则如下：
     * 1. 如果没有定义返回值，则返回: {typeName: null}。
     * 2. 如果返回值为一个导入的 `ResultData`（即只有一个可变类型字段），根据可变类型字段可变类型字段的类型，则返回：
     *    a. 如果可变类型字段为基本类型(字符、数值、布尔)，则返回 {typeName: `基本类型名称`}。
     *    b. 如果可变类型字段为自定义哈希类型 CustomModel，则返回 {typeName: `CustomModel`}。
     *    c. 如果可变类型字段是数组，则:
     *      i.  如果数组元素是基本类型(字符、数值、布尔) 或者自定义类型 CustomModel，则返回 {typeName: `基本类型名称或者CustomModel`, dim: `数组维数值`}。
     *      ii. 如果数组元素是数组(二维数组)，则根据二维数组的元素类型，递归执行规则 h。例如，如果二维数组的元素是 String, 则返回 {typeName: 'String', dim: 2}。
     * 3. 如果返回值为一个导入的自定义类型 CustomModel（但不是 ResultData），则返回：{typeName: `CustomModel`}。
     * 4. 如果返回值只有一个字段，则根据它的类型，按规则 2 执行。
     * 5. 如果返回值的字段个数大于 1, 则返回 {typeName: 'Object'}。
     * 6. 其他情况返回：{typeName: null}。
     *
     * @param  {object} params - 参数数组
     * @return  {Object} 输出参数的类型
     * @property  {String} typeName - 输出参数的模型名称
     * @property  {Number} dim - 如果输出参数模型是一个数组, 则它表示数组的维数, 0 表示不是数组, 1 表示一维数组, 依此类推
     */
    getOutputModel(params) {
        if (!params || params.length == 0) {
            return {
                typeName: null
            }
        }
        let datatypeName = null;
        params.some((item) => {
            if (item.datatypeName) {
                if (datatypeName === null) {
                    datatypeName = item.datatypeName;
                } else if (datatypeName !== item.datatypeName) {
                    datatypeName = null;
                    return true;
                }
            } else {
                datatypeName = null;
                return true;
            }
        });
        if (datatypeName) {
            // 是一个导入类型
            // 先验证是否只有一个可变类型
            let variableTypes = params.filter((item) => {
                return item.originalType === 10000;
            });
            if (variableTypes.length === 1) {
                // 检测是否为数组
                let varType = variableTypes[0];
                if (varType.isArray) {
                    return this.getDatatype(varType);
                } else {
                    return {
                        typeName: varType.typeName
                    }
                }
            } else {
                return {
                    typeName: datatypeName
                };
            }
        } else if (params.length === 1) {
            let param = params[0];
            if (param.isArray) {
                return this.getDatatype(param);
            } else {
                return {
                    typeName: param.typeName
                }
            }
        } else if (params.length > 1) {
            return {
                typeName: 'Object'
            }
        } else {
            return {
                typeName: null
            }
        }
    },
    /**
     * 返回某个数据模型的类型名称, 以及如果它是一个数组, 返回数组的维度值
     * @param  {Object} datatype - 数据模型
     * @return  {Object} 输出参数的类型
     * @property  {String} typeName - 数据模型的类型名称
     * @property  {Number} dim - 如果数据模型是一个数组, 则它表示数组的维数, 0 表示不是数组, 1 表示一维数组, 依此类推
     */
    getDatatype (datatype) {
        let arrDimLen = 0;
        let getType = (dt) => {
            if (dt.isArray) {
                arrDimLen++;
                let arrDatatype = this.neids.datatypes.find((item) => {
                    return item.id === dt.type;
                });
                return getType(arrDatatype);
            } else if (dt.format === neiDbConst.MDL_FMT_ARRAY) {
                // 数组类型
                arrDimLen++;
                let element = dt.params[0];
                if (element.isArray) {
                    return getType(element);
                } else {
                    return element.typeName;
                }
            } else {
                return dt.name;
            }
        }
        let elementTypeName = getType(datatype);
        return {
            typeName: elementTypeName,
            dim: arrDimLen
        }
    },

    /**
     * 获取规范所指定的编程语言
     * @param  {number} language - 语言代码
     */
    getSpecLanguage(language) {
        let ls = {};
        ls[neiDbConst.SPC_LNG_UNKNOWN] = 'unknown';
        ls[neiDbConst.SPC_LNG_JAVA] = 'java';
        ls[neiDbConst.SPC_LNG_PHP] = 'php';
        ls[neiDbConst.SPC_LNG_OC] = 'oc';
        ls[neiDbConst.SPC_LNG_SWIFT] = 'swift';
        return ls[language];
    },

    /**
     * 获取规范所指定的编程语言
     * @param  {number} engine - 模板引擎代码
     */
    getSpecEngine(engine) {
        let es = {};
        es[neiDbConst.SPC_ENG_NONE] = '';
        es[neiDbConst.SPC_ENG_EJS] = 'ejs';
        es[neiDbConst.SPC_ENG_FREEMARK] = 'freemarker';
        es[neiDbConst.SPC_ENG_SMARTY] = 'smarty';
        es[neiDbConst.SPC_ENG_SWIG] = 'swig';
        es[neiDbConst.SPC_ENG_VELOCITY] = 'velocity';
        return es[engine];
    },

    /**
     * 根据文件路径获取文件名, 不包括后缀
     * @param  {string} filePath - 文件路径
     */
    getFileNameByPath(filePath) {
        let extname = path.extname(filePath);
        return path.normalize(`${path.dirname(filePath)}/${path.basename(filePath, extname)}`).replace(/^\//, '');
    }
}