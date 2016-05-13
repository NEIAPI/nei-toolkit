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
     * update project
     * @return {undefined}
     */
    updateStart() {
        this.buildInterfaces();
        if (this.config.view) {
            this.buildTemplates();
        }
        this.buildTemplateRules();
        this.buildServerConfig();
        this.diffJSONData();
    }

    /**
     * build start
     * @return {undefined}
     */
    buildStart() {
        //this.installBowerDeps();
        let config = this.config;
        switch (config.projectType) {
            case 'hz.netease':
                this.buildHZNetEaseProject();
                this.buildInterfaces();
                this.buildTemplates();
                this.buildTemplateRules()
                this.buildServerConfig();
                this.installNpmDeps();
                this.installBowerDeps();
                this.diffJSONData();
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
        // 先构造 controller 数据
        this.pageControllers = this.data.pages.map((it) => {
            let controllerName = it.path.replace(/\/(.)/g,
                (match, group, cursor) => {
                    if (cursor === 0) {
                        return group;
                    }
                    return group.toUpperCase();
                }
            );
            // 默认取第一个模板
            let firstTemplate = this.data.templates.find((t) => {
                return t.id === it.templates[0];
            })
            return {
                path: it.path,
                controllerName: controllerName,
                handler: `page.${controllerName}`,
                method: `GET`,
                view: firstTemplate.path.replace(/^\/*(.)/g, (match, group) => {
                    return group
                }),
                title: firstTemplate.name,
                description: firstTemplate.description
            }
        });
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
                let content = func(Object.assign({
                    controllers: this.pageControllers
                }, this.config.templateData, this.config));
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
        let commonFilePath = `${this.config.outputRoot}view/common.${this.config.engine}`;
        let content = this.mergeTemplate(`${this.options.tplRoot}common.${this.config.engine}`);
        this.output(commonFilePath, content);
        // 生成页面文件
        this.buildTemplatePage(
            this.data.templates,
            commonFilePath
        );
        // 模板 mock 数据
        this.buildTemplateMock(
            this.data.templates, {
                mockRoot: `${this.config.outputRoot}/mock.data/template/`,
                overwrite: this.options.overwrite,
                checkTime: this.options.checkTime,
                filter: this.options.tplRoot + 'filter.js'
            }
        );
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
                    'common_file': path.relative(path.dirname(file), commonFilePath)
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
     * build local server config
     * @return {undefined}
     */
    buildServerConfig() {
        let config = this.config;
        let suffix = {
            ejs: 'ejs',
            jade: 'jade',
            handlebars: 'hbs',
            'hogan.js': 'hjs'
        };
        // output file config
        let file = this.cnfRoot;
        let webRoot = _path.normalize(
            path.relative(file, config.webRoot) + '/'
        );
        let viewRoot = _path.normalize(
            path.relative(file, config.viewRoot) + '/'
        );
        // interface mock dir path
        let I_MOCK_ROOT = '../mock.data/interface/';

        // template mock dir path
        let T_MOCK_ROOT = '../mock.data/template/';

        let fmap = {
            'jtr.js.tpl': {
                fileName: 'jtr.js',
                author: config.author,
                rules: this.rules,
                WEB_ROOT: webRoot,
                VIEW_ROOT: viewRoot,
                VIEW_EXTENTION: suffix[config.engine] || 'ejs',
                I_MOCK_ROOT: I_MOCK_ROOT,
                T_MOCK_ROOT: T_MOCK_ROOT,
                NEI_MOCK_API: (require('../../package.json').nei || {}).mock
            },
            'server.bat': {
                check: !0,
                WEB_ROOT: webRoot,
                mcss: config.mcss
            },
            'server.sh': {
                check: !0,
                WEB_ROOT: webRoot,
                mcss: config.mcss
            },
            'server.command': {
                check: !0,
                WEB_ROOT: webRoot,
                mcss: config.mcss
            }
        };
        // output server config
        Object.keys(fmap).forEach((name) => {
            let fileName = fmap[name].fileName || name;
            // check file exist
            if (fmap[name].check && _fs.exist(file + fileName)) {
                return;
            }
            // output file
            let content = this.mergeTemplate(
                this.options.tplRoot + name, fmap[name]
            );
            this.output(file + fileName, content);
            // `server.command` 文件需要有 `chmod u+x` 权限
            if (fileName === 'server.command') {
                fs.chmodSync(file + fileName, '755');
            }
        });
    }

    /**
     * install npm dependencies
     * @return {undefined}
     */
    installNpmDeps() {
        if (this.config.npm) {
            logger.log('debug', {
                message: `start installing npm dependencies`
            });
            var spawn = require('child_process').spawn;
            var bower = spawn('npm', ['install'], {
                cwd: `${this.config.outputRoot}`
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
                    message: 'npm dependencies install succeed'
                });
                logger.log('debug', {
                    message: `npm process exited with code ${code}`
                });
            });
        }
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
                cwd: `${this.config.outputRoot}public/src/`
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
}

module.exports = NodeBuilder;
