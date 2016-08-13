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
     * @param  {object} options - 参数
     * @property  {object} options.config - 一些构建工具需要使用的配置参数
     * @property  {object} options.args - 命令行参数
     * @property  {object} options.ds - nei 原始数据源
     */
    constructor(options) {
        super();
        this.config = options.config;
        this.args = options.args;
        this.ds = options.ds;
        // 渲染模板时传入的数据
        this.data = {
            args: this.args,
            ds: this.ds
        };
        this.buildDocs();
        this.buildInterfaceMock();
        this.buildTemplateMock();
    }

    /**
     * 生成工程规范文件
     */
    buildDocs() {
        let docs = this.ds.specs[0].docs;
        let genFiles = (ds, itemName, doc, dir) => {
            ds.forEach((item) => {
                let data = Object.assign({}, this.data);
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
                            let filename = swig.render(doc.name, {locals: this.data});
                            let file = _path.normalize(`${dir}/${filename}`);
                            let content = swig.render(doc.content, {locals: this.data});
                            this.output(file, content);
                            break;
                        case neiDbConst.SPC_DTS_INTERFACE:
                            // 以异步接口列表为数据源填充
                            genFiles(this.ds.interfaces, 'interface', doc, dir);
                            break;
                        case neiDbConst.SPC_DTS_DATATYPE:
                            // 以数据模型列表为数据源填充
                            genFiles(this.ds.datatypes, 'datatype', doc, dir);
                            break;
                        case neiDbConst.SPC_DTS_TEMPLATE:
                            // 以页面模板列表为数据源填充
                            genFiles(this.ds.templates, 'template', doc, dir);
                            break;
                        case neiDbConst.SPC_DTS_WEBVIEW:
                            // 以页面列表为数据源填充
                            genFiles(this.ds.pages, 'page', doc, dir);
                            break;
                        default:
                            break;
                    }
                } else {
                    switch (doc.id) {
                        default: break;
                    }
                    // 目录
                    let filename = swig.render(doc.name, {locals: this.data});
                    let file = _path.normalize(`${dir}/${filename}`);
                    genDocs(doc.children, file);
                }
            });
        }
        genDocs(docs, this.config.outputRoot);
    }

    /**
     * 生成异步接口的mock数据
     */
    buildInterfaceMock() {

    }

    /**
     * 生成页面模板的mock数据
     */
    buildTemplateMock() {

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

