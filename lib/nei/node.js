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
        config.webRoot = '../public';
        config.viewRoot = '../view';
        super(config, {
            tplRoot: __dirname + '/node/template/'
        });
    }

    /**
     * format data from nei
     * @return {undefined}
     */
    formatData() {
        super.formatData();
        // format rules
        this._rules = [];
        // format template
        let ret = {};
        (this.data.templates || []).forEach((it) => {
            ret[it.id] = it;
        });
        this.tplMap = ret;
    }

    /**
     * build templates
     * @return {undefined}
     */
    buildTemplates() {
        let config = this.config;
        // build template page
        this.buildTemplatePage(
            this.data.templates
        );
        // build template mock
        this.buildTemplateMock(
            this.data.templates, {
                mockRoot: config.tMockRoot || (config.viewRoot + 'mock/'),
                overwrite: this.options.overwrite,
                checkTime: this.options.checkTime,
                filter: this.options.tplRoot + 'filter.js'
            }
        );
    }

    /**
     * build template page
     * @param  {array}  list - template definition list
     * @return {undefined}
     */
    buildTemplatePage(list) {
        let config = this.config;
        let web = config.webRoot;
        let root = config.viewRoot;
        (list || []).forEach((it) => {
            let file = _path.absoluteAltRoot(
                it.path, root, root
            );
            // generate page file name
            // /usr/webapp/views/page/home/test.ftl -> page/home/test
            let filename = this.parseFileName(
                it.path, root
            );
            it.mock = filename;
            // check if template exist
            // 模板文件很有可能在本地已经做过修改, 如果文件存在就直接忽略
            if (_fs.exist(file)) {
                return logger.log('debug', {
                    data: [file],
                    message: 'template exist %s'
                });
            }
            // check if only update the specified `tag`
            if (config.tag && typeof it.tag !== 'undefined') {
                let tags = it.tag.split(',');
                if (tags.indexOf(config.tag) === -1) {
                    return logger.log('debug', {
                        data: [file, config.tag],
                        message: 'template %s has no tag of "%s"'
                    });
                }
            }
            // generate template file content
            let content = this.mergeTemplate(
                this.options.tplRoot + 'page.ftl', {
                    filename: filename,
                    title: it.name || '页面标题',
                    description: it.description || '页面描述'
                }
            );
            this.output(file, content);
            // build page style
            file = util.format(
                '%ssrc/css/%s.css',
                web, filename
            );
            this.output(file, '');
            if (config.mcss) {
                // build page mcss code
                file = util.format(
                    '%ssrc/mcss/%s.mcss',
                    web, filename
                );
                this.output(file, '');
            }
            // build page script
            file = util.format(
                '%ssrc/javascript/%s.js',
                web, filename
            );
            content = this.mergeTemplate(
                this.options.tplRoot + 'page.js', {
                    // TODO
                }
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
            this._rules.push({
                method: 'GET',
                path: it.path,
                mockDataPath: it.path.replace(/:/g, ''),
                func: util.format(
                    'u.r(0,%s)',
                    ret
                ),
                list: ret,
                type: 'tpl',
                name: it.name
            });
        });
    }

    /**
     * build mock filter
     * @param  {array}   list - interface list
     * @return {undefined}
     */
    buildInterfaceRules(list) {
        (list || []).forEach((it) => {
            this._rules.push({
                path: it.path,
                mockDataPath: it.path.replace(/:/g, ''),
                method: this.getReqMethod(it.method),
                id: it.id,
                type: 'api',
                name: it.name
            });
        });
    }

    /**
     * build interface mock data and rules
     * @return {undefined}
     */
    buildInterface() {
        // build api mock data
        this.buildInterfaceMock(
            this.data.interfaces, {
                mockRoot: './mock/interface/',
                overwrite: this.options.overwrite,
                checkTime: this.options.checkTime,
                filter: this.options.tplRoot + 'filter.js'
            }
        );
        // build api mock filter
        this.buildInterfaceRules(this.data.interfaces);
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
                this.buildInterface();
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
