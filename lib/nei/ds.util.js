/*
 * NEI data source format
 * @author huntbao
 */
'use strict';
let neiDbConst = require('../fb-modules/config/db.json');

module.exports = {
    /**
     * 格式化 nei 数据源
     * @param  {object} neiDs - nei 上的数据源
     */
    format(neiDs) {
        let ds = {
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
                ds.templates.push({
                    name: item.name,
                    path: item.path,
                    tag: item.tag,
                    description: item.description,
                    group: {
                        name: item.group.name,
                        description: item.group.description
                    },
                    params: getParams(item.params)
                });
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
                // 所有的枚举类型
                ds.datatypeEnums.push({
                    name: item.name,
                    // 取第一个成员的类型
                    type: getType(item.params[0].typeName),
                    members: getKVs(item.params)
                })
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
    }
}