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
        let spec = this.ds.specs[0].spec;
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
                            genFiles(this.ds.pages, 'page', doc, dir);
                            break;
                        default:
                            break;
                    }
                } else {
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
        // 工程结构中没有设置异步接口的mock数据根目录
        if (!this.config.mockApiRoot) {
            return;
        }
        let mockApiRoot = this.config.mockApiRoot;
        let getUrl = (itf) => {
            let url = itf.path;
            // 如果是 get 请求, 需要将输入参数添加到 url 当中去
            if (itf.method.toLowerCase() === 'get') {
                let queryStrObj = {};
                itf.params.inputs.forEach((input) => {
                    // 可能有多个相同的查询参数, 统一使用数组的形式
                    if (!queryStrObj[input.name]) {
                        queryStrObj[input.name] = [];
                    }
                    queryStrObj[input.name].push('');
                });
                let queryStr = querystring.stringify(queryStrObj);
                if (queryStr) {
                    if (url.indexOf('?') === -1) {
                        url += `?${queryStr}`;
                    } else {
                        url += `&${queryStr}`;
                    }
                }
            }
            return url;
        };
        let getMockDataPath = (url) => {
            // windows 的文件夹名称不能有特殊字符, 将 url 中的 ": ? & =" 转成 "/_/"
            return _path.normalize(url.replace(/:|\?|&|=/g, '/_/') + '/data');
        };
        this.ds.interfaces.forEach((itf)=> {
            let method = itf.method.toLowerCase();
            let url = getUrl(itf);
            let name = getMockDataPath(url);
            let file = _path.normalize(`${mockApiRoot}/${method}/${name}`);
            let mockDataFile = `${file}.json`;
            // 是否覆盖已经存在的 mock 数据文件
            if (_fs.exist(mockDataFile) && !this.args.overwriteMock) {
                return logger.log('debug', {
                    message: `接口 mock 文件已存在, 不覆盖: ${mockDataFile}`
                });
            }
            let json = mockData.getParams(itf.resFormat, itf.params.outputs, this.ds.datatypes);
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
        this.ds.templates.forEach((it)=> {
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
            let json = mockData.getParams(neiDbConst.MDL_TYP_NORMAL, params, this.ds.dataTypes);
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

