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
let neiDbConst = require('../fb-modules/config/db.json');

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
        let genFiles = (ds, itemName, doc, dir) => {
            ds.forEach((item) => {
                let data = {
                    config: this.config
                };
                data[itemName] = item;
                let filename = swig.render(doc.name, {locals: data});
                let file = _path.normalize(`${dir}/${filename}`);
                let content = swig.render(doc.content, {locals: data});
                this.output(file, content);
            });
        }
        let genDocs = (docs, dir) => {
            docs.forEach((doc) => {
                if (doc.type === neiDbConst.SPC_NOD_FILE) {
                    // 文件
                    switch (doc.dataSource) {
                        case neiDbConst.SPC_DTS_NONE:
                            // 普通文件, 没有数据源
                            let filename = swig.render(doc.name, {locals: this.config});
                            let file = _path.normalize(`${dir}/${filename}`);
                            let content = swig.render(doc.content, {locals: this.config});
                            this.output(file, content);
                            break;
                        case neiDbConst.SPC_DTS_INTERFACE:
                            // 以异步接口列表为数据源填充
                            genFiles(this.config.ds.interfaces, 'interface', doc, dir);
                            break;
                        case neiDbConst.SPC_DTS_DATATYPE:
                            // 以数据模型列表为数据源填充
                            genFiles(this.config.ds.datatypes, 'datatype', doc, dir);
                            break;
                        case neiDbConst.SPC_DTS_TEMPLATE:
                            // 以页面模板列表为数据源填充
                            genFiles(this.config.ds.templates, 'template', doc, dir);
                            break;
                        case neiDbConst.SPC_DTS_WEBVIEW:
                            // 以页面列表为数据源填充
                            genFiles(this.config.ds.pages, 'page', doc, dir);
                            break;
                        default:
                            break;
                    }
                } else {
                    // 目录
                    let filename = swig.render(doc.name, {locals: this.config});
                    let file = _path.normalize(`${dir}/${filename}`);
                    genDocs(doc.children, file);
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
        logger.log('debug', {
            data: [file],
            message: 'output %s'
        });
    }
}

module.exports = Builder;

