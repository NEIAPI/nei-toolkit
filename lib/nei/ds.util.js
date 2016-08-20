/*
 * NEI data source format
 * @author huntbao
 */
'use strict';
let path = require('path');
let neiDbConst = require('../fb-modules/config/db.json');

module.exports = {
    /**
     * 格式化 nei 数据源
     * @param  {object} neiDs - nei 上的数据源
     */
    format(neiDs) {
        let ds = {
            project: {},
            spec: {},
            views: [],
            templates: [],
            interfaces: [],
            datatypes: [],
            datatypeEnums: []
        };
        let varmaps = this.getVarmaps(neiDs.specs[0].varmaps);
        let getType = (type) => {
            return varmaps[type] || type;
        };
        let getParams = (params) => {
            return params.map((item) => {
                return {
                    name: item.name,
                    type: getType(item.typeName),
                    isArray: item.isArray,
                    defaultValue: item.defaultValue,
                    genExp: item.genExpression
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
        // 项目数据
        ds.project = {
            id: neiDs.project.id,
            name: neiDs.project.name,
            description: neiDs.project.description,
            creator: {
                email: neiDs.project.creator.email,
                name: neiDs.project.creator.realname
            }
        };
        // 规范数据
        let spec = neiDs.specs[0].spec;
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
        ds.views = neiDs.pages.map((item) => {
            item.templates.forEach(function (tpl) {
                usedTemplateIds[tpl.id] = 1;
            });
            return {
                name: item.name,
                path: item.path,
                tag: item.tag,
                title: item.title,
                description: item.description,
                group: {
                    name: item.group.name,
                    description: item.group.description
                }
            }
        });
        // 页面模板, 只处理被页面引用的模板
        neiDs.templates.forEach((item) => {
            if (usedTemplateIds[item.id]) {
                let tpl = {
                    name: item.name,
                    path: item.path,
                    tag: item.tag,
                    description: item.description,
                    group: {
                        name: item.group.name,
                        description: item.group.description
                    },
                    params: getParams(item.params)
                };
                // 处理 path, 如果没有后缀, 加上规范中指定的模板扩展名
                let extname = path.extname(tpl.path);
                if (!extname && ds.spec.viewExt) {
                    tpl.path += `.${ds.spec.viewExt}`;
                }
                // 对应的 css 和 js 等资源文件会用到这个值
                tpl.filename = this.getFileNameByPath(tpl.path);
                ds.templates.push(tpl);
            }
        });
        // 异步接口
        ds.interfaces = neiDs.interfaces.map((item) => {
            var nItem = {
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
                importedOutput: this.getImported(item.params.outputs),
                reqHeaders: null,
                reqFormat: item.reqFormat,
                resFormat: item.resFormat
            };
            nItem.inputs = getParams(item.params.inputs);
            nItem.outputs = getParams(item.params.outputs);
            if (nItem.importedOutput) {
                nItem.importedOutput = getType(nItem.importedOutput);
            }
            nItem.reqHeaders = getKVs(item.params.reqHeaders);
            return nItem;
        });
        neiDs.datatypes.forEach((item) => {
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
     * 判断输出参数是否为一个导入类型, 后端在接口代码中需要该信息
     * 如果是一个导入类型, 就返回导入类型的名称
     * @param  {object} params - 参数数组
     */
    getImported(params) {
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
        return datatypeName;
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
        return `${path.dirname(filePath)}/${path.basename(filePath, extname)}`;
    }
}