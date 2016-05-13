/*
 * Node.js project builder
 * @author huntbao
 */

'use strict';

let path = require('path');
let util = require('util');
let fs = require('fs');
let swig = require('swig');
let Builder = require('./builder');
let _fs = require('../util/file');
let _path = require('../util/path');
let logger = require('../util/logger');

class NodeBuilder extends Builder {
    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
        config.webRoot = `${config.outputRoot}public/`;
        config.viewRoot = `${config.outputRoot}view/`;
        super(config, {
            tplRoot: `${__dirname}/node/template/`
        });
    }

    /**
     * format data from nei
     * @return {undefined}
     */
    formatData() {
        super.formatData();
        // format rules
        this.rules = [];
        // format template
        let ret = {};
        (this.data.templates || []).forEach((it) => {
            ret[it.id] = it;
        });
        this.tplMap = ret;
    }


    /**
     * install bower dependencies
     * @return {undefined}
     */
    installBowerDeps() {
        if (this.config.bower) {
            logger.log('debug', {
                message: `start installing bower dependencies`
            });
            var spawn = require('child_process').spawn;
            var bower = spawn('bower', ['install'], {
                cwd: `${this.config.outputRoot}/src/main/webapp`
            });
            bower.stdout.on('data', (data) => {
                logger.log('debug', {
                    message: `${data}`
                });
            });
            bower.stderr.on('data', (data) => {
                logger.log('debug', {
                    message: `error: ${data}`
                });
            });
            bower.on('close', (code) => {
                logger.log('debug', {
                    message: 'bower dependencies install succeed'
                });
                logger.log('debug', {
                    message: `child process exited with code ${code}`
                });
            });
        }
    }

    /**
     * build start
     * @return {undefined}
     */
    buildStart() {
        //this.buildTemplates();
        //this.buildTemplateRules();
        //this.buildServerConfig();
        //this.diffJSONData();
        //this.installBowerDeps();

        let config = this.config;
        switch (config.projectType) {
            case 'hz.netease':
                this.buildHZNetEaseProject();
                this.buildInterfaces();
                this.buildTemplates();
                break;
            default:
                break;
        }
    }

    /**
     * build `hz.netease` node project
     * @return {undefined}
     */
    buildHZNetEaseProject() {
        logger.log('debug', {
            message: `building project template files...`
        });
        _fs.cpdir(`${__dirname}/node/project_template/`, this.config.outputRoot, null);

        let templates = {};
        let files = _fs.lsfile(this.config.outputRoot, (fileName, file) => {
            logger.log('debug', {
                message: `compile template ${file}`
            });
            // 有些文件如果有乱码，会导致编译异常
            try {
                templates[file] = swig.compileFile(file, {autoescape: false});
                // 如果 tokens.length === 1, 则说明没有需要替换的内容, 返回 false 以过滤掉该文件
                return templates[file].tokens.length !== 1;
            } catch (err) {
                logger.log('error', {
                    message: `compile template error: ${err}`
                });
            }
            return false;
        });

        files.forEach((file) => {
            file = _path.normalize(file);
            let func = templates[file];
            if (func) {
                let content = func(this.config);
                this.output(file, content);
            }
        });
    }

    /**
     * build interface mock data and rules
     * @return {undefined}
     */
    buildInterfaces() {
        // build api mock data
        this.buildInterfaceMock(
            this.data.interfaces, {
                mockRoot: `${this.config.outputRoot}/mock.data/interface/`,
                overwrite: this.options.overwrite,
                checkTime: this.options.checkTime,
                filter: this.options.tplRoot + 'filter.js'
            }
        );
        // build api mock filter
        this.buildInterfaceRules(this.data.interfaces);
    }

    /**
     * build mock filter
     * @param  {array}   list - interface list
     * @return {undefined}
     */
    buildInterfaceRules(list) {
        (list || []).forEach((it) => {
            this.rules.push({
                path: it.path,
                mockDataPath: it.path.replace(/[^\w./]|(?:\/$)/g, ''),
                method: this.getReqMethod(it.method),
                id: it.id,
                type: 'api',
                name: it.name
            });
        });
    }

    /**
     * build templates
     * @return {undefined}
     */
    buildTemplates() {
        // 生成页面的 common 文件
        let commonFilePath = `${this.config.outputRoot}/view/common.${this.config.engine}`;
        let content = this.mergeTemplate(`${this.options.tplRoot}common.${this.config.engine}`);
        this.output(commonFilePath, content);
        // 生成页面文件
        this.buildTemplatePage(
            this.data.templates,
            commonFilePath
        );
        //// build template mock
        //this.buildTemplateMock(
        //    this.data.templates, {
        //        mockRoot: this.config.tMockRoot || (this.config.viewRoot + 'mock/'),
        //        overwrite: this.options.overwrite,
        //        checkTime: this.options.checkTime,
        //        filter: this.options.tplRoot + 'filter.js'
        //    }
        //);
    }

    /**
     * build template page
     * @param  {array}  list - template definition list
     * @param  {string}  commonFilePath - common file path
     * @return {undefined}
     */
    buildTemplatePage(list, commonFilePath) {
        let config = this.config;
        let webRoot = config.webRoot;
        let viewRoot = config.viewRoot;
        (list || []).forEach((it) => {
            let file = _path.absoluteAltRoot(it.path, viewRoot, viewRoot);
            // ./view/page/home/test.ejs --> page/home/test
            let filename = this.parseFileName(it.path, viewRoot);
            it.mock = filename;
            // 模板文件很有可能在本地已经做过修改, 如果文件存在就直接忽略
            if (_fs.exist(file)) {
                return logger.log('debug', {
                    message: `template exist ${file}`
                });
            }
            // 只更新指定 `tag` 的模板
            if (config.tag && config.action === `update` && typeof it.tag !== 'undefined') {
                let tags = it.tag.split(',');
                if (tags.indexOf(config.tag) === -1) {
                    return logger.log('debug', {
                        message: `template ${file} has no tag of "${config.tag}"`
                    });
                }
            }
            let templateData = Object.assign({}, config.templateData, {
                    author: config.author,
                    filename: filename,
                    'common_file': path.relative(file, commonFilePath)
                }
            );
            // 页面内容
            let content = this.mergeTemplate(
                `${this.options.tplRoot}page.${config.engine}`,
                templateData
            );
            this.output(file, content);
            // 页面样式
            file = `${webRoot}src/page/${filename}.css`;
            content = this.mergeTemplate(
                `${this.options.tplRoot}page.css`,
                templateData
            );
            this.output(file, content);
            if (config.mcss) {
                // 页面 mcss 样式文件
                file = `${webRoot}src/page/${filename}.mcss`;
                content = this.mergeTemplate(
                    `${this.options.tplRoot}page.mcss`,
                    templateData
                );
                this.output(file, content);
            }
            // 页面脚本
            file = `${webRoot}src/page/${filename}.js`;
            content = this.mergeTemplate(
                `${this.options.tplRoot}page.js`,
                templateData
            );
            this.output(file, content);
        });
    }

    /**
     * build page to template rules
     * @return {undefined}
     */
    buildTemplateRules() {
        let list = this.data.pages;
        let cache = this.tplMap || {};
        (list || []).forEach((it) => {
            let tpls = it.templates;
            // check path
            if (!it.path || !tpls || !tpls.length) {
                return;
            }
            // dump template list
            let ret = [];
            tpls.forEach((id) => {
                let tpl = cache[id];
                ret.push({
                    id: id,
                    path: tpl.mock
                })
            });
            ret = JSON.stringify(ret);
            // save rules
            this.rules.push({
                method: 'GET',
                path: it.path,
                mockDataPath: it.path.replace(/[^\w./]|(?:\/$)/g, ''),
                list: ret,
                type: 'tpl',
                name: it.name
            });
        });
    }

    /**
     * update project
     * @return {undefined}
     */
    updateStart() {
        this.buildWebApp();
        if (this.config.view) {
            this.buildTemplates();
        }
        this.buildTemplateRules();
        this.buildServerConfig();
        this.diffJSONData();
    }

    /**
     * do something before build done
     * @return {undefined}
     */
    beforeDone() {
        let config = this.config;
    }
}

module.exports = NodeBuilder;
