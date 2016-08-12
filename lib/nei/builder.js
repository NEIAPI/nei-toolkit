/*
 * NEI Builder
 * @author huntbao
 */

'use strict';
let vm = require('vm');
let util = require('util');
let querystring = require('querystring');
let swig = require('swig');
let EventEmitter = require('events');
let _io = require('../util/io');
let _fs = require('../util/file');
let _path = require('../util/path');
let _util = require('../util/util');
let logger = require('../util/logger');

class Builder extends EventEmitter {
    /**
     * @param  {object} cliArgs - 命令行参数
     * @param  {object} config - 配置参数
     */
    constructor(cliArgs, config) {
        super();
        this.cliArgs = cliArgs;
        this.config = config;
        this.buildDocs();
    }

    /** 构建工程规范文件
     */
    buildDocs() {
        let docs = this.config.ds.specs[0].docs;
        let outputRoot = this.config.outputRoot;
        let genDocs = (docs, dir) => {
            docs.forEach((doc) => {
                if (doc.type === 1) {
                    // 普通文件
                    if (doc.dataSource === 0) {
                        let filename = swig.render(doc.name, {locals: this.config});
                        let file = _path.normalize(`${dir}/${filename}`);
                        this.output(file, doc.content);
                    }
                }
            });
        }
        genDocs(docs, outputRoot);
    }

    /**
     * 同步写文件
     * @param  {string} file - 文件完整路径, 包括文件名
     * @param  {string} content - 文件内容
     */
    output(file, content) {
        _io.outputSync(file, content);
        logger.log('debug', `output ${file}`);
    }

    /**
     * get request name
     * @param  {object} itf - interface object
     * @param  {boolean=true} printMsg - print message to console
     * @return {string} - request name
     */
    getReqClassName(itf, printMsg) {
        let name = itf.className;
        if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
            return name;
        } else if (printMsg) {
            let tip;
            if (name) {
                tip = `接口 "${itf.name}" 的类名 "${name}" 不合法, 尝试使用名称`;
            } else {
                tip = `接口 "${itf.name}" 没有指定类名, 尝试使用名称`;
            }
            logger.log('error', {
                message: tip
            });
        }
        name = itf.name;
        if (/^[0-9a-zA-Z_$]+$/gi.test(name)) {
            return name;
        } else if (printMsg) {
            logger.log('error', {
                message: `接口 "${itf.name}" 的名称不能作为类名使用, 尝试转换 url 作为类名`
            });
        }
        // name is invalid for class name, using path's camelCase format
        return itf.path.replace(/\/(.)/g, (match, group1) => {
            return group1.toUpperCase();
        }).replace(/\//g, '');
    }
}

module.exports = Builder;

