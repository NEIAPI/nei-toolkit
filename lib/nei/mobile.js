/*
 * Mobile builder base class
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
let url = require('url');
let Builder = require('./builder');
let logger = require('../util/logger');

class MobileBuilder extends Builder {

    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
        const TPL_ROOT = __dirname + '/mobile/template/';
        super(config, {
            tplRoot: TPL_ROOT
        });
    }

    /**
     * export model
     * @return {undefined}
     */
    initModConfig() {
        // save config
        let config = this.config;
        let time = new Date();
        this.modConfig = {
            prefix: config.namePrefix,
            base: config.reqAbstract,
            model: config.modelAbstract,
            rheader: config.reqHeaders,
            mheader: config.modelHeaders,
            aPkg: config.appPackage,
            mPkg: config.modelPackage,
            htPkg: config.reqPackage,
            author: config.author,
            lang: config.lang,
            year: time.getFullYear(),
            month: time.getMonth() + 1,
            day: time.getDate(),
            baseModel: config.baseModelAbstract
        };
    }

    /**
     * sort interfaces by it's path
     * @return {undefined}
     */
    sortData() {
        this.data.interfaces.sort(function (a, b) {
            return a.path < b.path ? -1 : 1;
        });
    }

    // split data type by enum type and common type
    splitDataType() {
        let ret = {
            enums: [],
            models: []
        };
        Object.keys(this.dataTypes).forEach((id) => {
            let type = this.dataTypes[id];
            if (type.format == 1) {
                // for enum type
                ret.enums.push(type);
            } else {
                // for hash map
                let isAbstr = !1;
                type.attrs.forEach((it) => {
                    if (it.type == 10000) {
                        isAbstr = !0;
                    }
                });
                if (!isAbstr) {
                    ret.models.push(id);
                }
            }
        });
        return ret;
    }

    /**
     * check if params is an imported data type
     * @param  {object} params - inputs or outputs
     * @return {boolean}
     */
    isAnImportedDataType(params) {
        if (!params || !Array.isArray(params) || !params.length) {
            return false;
        }
        let datatypeId;
        for (let i = 0, l = params.length; i < l; i++) {
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
    }

    /**
     * check if params has only one custom data type
     * @param  {object} params - inputs or outputs
     * @param  {object} systemDataTypeMap - system data type map
     * @return {boolean}
     */
    hasOnlyOneCustomDataType(params, systemDataTypeMap) {
        if (!params || !Array.isArray(params) || !params.length) {
            return false;
        }
        let customDataType;
        for (let i = 0, l = params.length; i < l; i++) {
            if (params[i].datatypeId) {
                return false;
            }
            if (!systemDataTypeMap[params[i].type]) {
                if (customDataType) {
                    return false;
                }
                customDataType = params[i].type;
            }
        }
        return !!customDataType;
    }

    /**
     * check if params is a `ResultData`, this is the most normal case
     * `ResultData` has only one variable field
     * @param  {array} params - inputs or outputs
     * @return {boolean} - check result
     */
    isResultDataType(params) {
        if (!params || !Array.isArray(params) || !params.length) {
            return false;
        }
        if (this.isAnImportedDataType(params)) {
            let dataType = this.dataTypes[params[0].datatypeId];
            let attrs = dataType.attrs.filter((attr) => {
                return attr.type === 10000;
            });
            if (attrs.length === 1) {
                return true;
            }
        }
        return false;
    }

    /**
     * get `variable` field from an imported datatype
     * @param  {array} params - inputs or outputs
     * @return {object} - result field
     */
    getResultField(params) {
        let dataType = this.dataTypes[params[0].datatypeId];
        let varField = dataType.attrs.find((attr) => {
            return attr.type === 10000;
        });
        return params.find((param) => {
            return param.name === varField.name;
        });
    }

    /**
     * after output done
     * @return {undefined}
     */
    afterOutput() {
        this.beforeDone();
        logger.log('info', {
            message: 'build success'
        });
    }

    /**
     * build project
     * @param  {object} [data] - nei resource data
     * @return {undefined}
     */
    build(data) {
        if (data) {
            super.start(this.buildStart, data);
        } else {
            // build empty project, without models and requests
            logger.log('info', {
                message: 'no project id, start building empty project files'
            });
            this.buildStart(true);
        }
    }

}

module.exports = MobileBuilder;
