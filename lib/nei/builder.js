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
let mockData = require('../fb-modules/util/mock_data');
let neiDbConst = require('../fb-modules/config/db.json');
let dsUtil = require('./ds.util')

const DEFAULT_MOCK_FILTER = ['module.exports = function (json) {', '\treturn json;', '}'].join('\n');
const TEXT_REGEX = /^(text\/.+)|(application\/json)$/;

class Builder extends EventEmitter {
    /**
     * @param  {object} options - 参数
     * @property  {object} options.config - 一些构建工具需要使用的配置参数
     * @property  {object} options.args - 命令行参数
     * @property  {object} options.ds - nei 原始数据源
     */
    constructor(options) {
        super();
        this.options = options;
        this.config = options.config;
        this.args = options.args;
        this.spec = options.ds.specs[0];
        this.ds = dsUtil.format(options.ds);
        // 渲染模板时传入的数据
        this.project = options.ds.project;
        this.data = {
            args: this.args,
            project: {
                id: this.project.id,
                name: this.project.name,
                description: this.project.description,
                creator: {
                    email: this.project.creator.email,
                    name: this.project.creator.realname
                }
            },
            interfaceMockRules: [],
            ds: this.ds
        };
        // 先找配置文件
        this.findConfigs();
        // 先构建mock数据, 因为mock数据的信息需要传给swig模板
        this.buildInterfaceMock();
        this.buildTemplateMock();
        this.buildDocsTree();
    }

    /**
     * 找配置文件
     */
    findConfigs() {
        let docs = this.spec.docs;
        let spec = this.spec.spec;
        let find = (docs, dir) => {
            docs.forEach((doc) => {
                if (doc.type === neiDbConst.SPC_NOD_DIR) {
                    // 目录
                    let filename = swig.render(doc.name, {locals: this.data});
                    let file = _path.normalize(`${dir}/${filename}`);
                    switch (doc.id) {
                        case spec.attributes.webRoot:
                            this.config.webRoot = file;
                            break;
                        case spec.attributes.viewRoot:
                            this.config.viewRoot = file;
                            break;
                        case spec.attributes.mockApiRoot:
                            this.config.mockApiRoot = file;
                            break;
                        case spec.attributes.mockViewRoot:
                            this.config.mockViewRoot = file;
                            break;
                        default:
                            break;
                    }
                    find(doc.children, file);
                }
            });
        }
        find(docs, this.config.outputRoot);
    }
    /**
     * 生成异步接口的mock数据
     */
    buildInterfaceMock() {
        // 工程结构中没有设置异步接口的mock数据根目录
        if (!this.config.mockApiRoot) {
            return;
        }
        let mockApiRoot = this.config.mockApiRoot;
        let getMockDataPath = (url) => {
            // windows 的文件夹名称不能有特殊字符, 将 url 中的 ": ? & =" 转成 "/_/"
            return _path.normalize(url.replace(/:|\?|&|=/g, '/_/') + '/data');
        };
        // 给接口代理工具准备的数据, 比如 fiddler
        this.options.ds.interfaces.forEach((itf)=> {
            let method = itf.method.toLowerCase();
            let url = itf.path;
            let name = getMockDataPath(url);
            let file = _path.normalize(`${mockApiRoot}/${method}/${name}`);
            let mockDataFile = `${file}.json`;
            this.data.interfaceMockRules.push({
                path: url,
                mockFile: mockDataFile,
                method: method.toUpperCase()
            });
            // 是否覆盖已经存在的 mock 数据文件
            if (_fs.exist(mockDataFile) && !this.args.overwriteMock) {
                return logger.log('debug', {
                    message: `接口 mock 文件已存在, 不覆盖: ${mockDataFile}`
                });
            }
            let json = mockData.getParams(itf.resFormat, itf.params.outputs, this.options.ds.datatypes);
            this.output(mockDataFile, JSON.stringify(json, null, 4));
            // 输出 mock filter
            let mockFilterFile = `${file}.js`;
            if (!_fs.exist(mockFilterFile)) {
                this.output(mockFilterFile, DEFAULT_MOCK_FILTER);
            } else {
                logger.log('debug', {
                    message: `接口 mock filter 已存在: ${mockFilterFile}`
                });
            }
        });
    }

    /**
     * 生成页面模板的mock数据
     */
    buildTemplateMock() {
        // 工程结构中没有设置视图的mock数据根目录
        if (!this.config.mockViewRoot) {
            return;
        }
        this.options.ds.templates.forEach((it)=> {
            let hit = this.ds.templates.find((tpl) => {
                return tpl.path === it.path;
            });
            if (!hit) {
                // 模板没有被页面引用, 不用处理
                return;
            }
            let params = it.params;
            if (!params || !params.length) {
                return;
            }
            let filename = it.path.replace(/\.[^\/]*?$/, '');
            let file = _path.normalize(`${this.config.mockViewRoot}/${filename}`);
            let mockDataFile = `${file}.json`;
            if (_fs.exist(mockDataFile) && !this.args.overwriteMock) {
                return logger.log('debug', {
                    data: [file],
                    message: `页面模板 mock 文件已存在, 不覆盖: ${mockDataFile}`
                });
            }
            let json = mockData.getParams(neiDbConst.MDL_TYP_NORMAL, params, this.options.ds.datatypes);
            // 页面标题
            json.title = json.title || it.name;
            // 页面描述
            json.description = json.description || it.description;
            this.output(mockDataFile, JSON.stringify(json, null, 4));
            // 输出 mock filter
            let mockFilterFile = `${file}.js`;
            if (!_fs.exist(mockFilterFile)) {
                this.output(mockFilterFile, DEFAULT_MOCK_FILTER);
            } else {
                logger.log('debug', {
                    message: `页面模板 mock filter 已存在: ${mockFilterFile}`
                });
            }
        });
    }

    /**
     * 生成工程规范文件
     */
    buildDocsTree() {
        let docs = this.spec.docs;
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
                    // 先判断文件是否是非文本
                    if (!TEXT_REGEX.test(doc.mime)) {
                        let filename = swig.render(doc.name, {locals: this.data});
                        let file = _path.normalize(`${dir}/${filename}`);
                        if (_fs.exist(file)) {
                            return logger.log('debug', {
                                message: `文件已存在, 不覆盖: ${file}`
                            });
                        }
                        return _io.downloadFile(doc.content, file);
                    }
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
                            genFiles(this.ds.pages, 'view', doc, dir);
                            break;
                        default:
                            break;
                    }
                } else {
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
     * 同步写文件
     * @param  {string} file - 文件完整路径, 包括文件名
     * @param  {string} content - 文件内容
     */
    output(file, content) {
        _io.outputSync(file, content);
        logger.log('debug', {
            data: [file],
            message: '输出: %s'
        });
    }
}

module.exports = Builder;

