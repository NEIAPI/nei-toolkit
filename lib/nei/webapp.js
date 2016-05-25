/*
 * WebApp Builder
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
let fs = require('fs');
let Builder = require('./builder');
let _fs = require('../util/file');
let _path = require('../util/path');
let logger = require('../util/logger');

class WebAppBuilder extends Builder {
    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
        const TPL_ROOT = __dirname + '/webapp/template/';
        super(config, {
            tplRoot: TPL_ROOT
        });
    }

    /**
     * extend config
     * @return {undefined}
     */
    extendConfig() {
        Object.assign(this.config, {
            webRoot: _path.absolute(
                this.config.webRoot || './src/main/webapp/',
                this.config.outputRoot
            ),
            viewRoot: _path.absolute(
                this.config.viewRoot || './src/main/webapp/WEB-INF/views/',
                this.config.outputRoot
            ),
            engine: this.config.engine || 'freemarker'
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
     * build deploy config
     * @return {undefined}
     */
    buildDeploy() {
        let config = this.config;
        // build deploy file
        let file = _path.absolute(
            './deploy/release.' + config.id + '.conf',
            config.deployRoot || config.outputRoot
        );
        // check file exist
        if (_fs.exist(file)) {
            return;
        }
        // output deploy config
        let content = this.mergeTemplate(
            this.options.tplRoot + 'release.conf', {
                PROJECT_ID: config.id,
                DIR_WEBROOT: _path.normalize(
                    path.relative(path.dirname(file), config.webRoot) + '/'
                ),
                DIR_SOURCE_TP: './' + _path.normalize(
                    path.relative(config.webRoot, config.viewRoot) + '/'
                ),
                DIR_OUTPUT_TP: './' + _path.normalize(
                    path.relative(
                        config.webRoot,
                        path.dirname(config.viewRoot) + '/views.out/'
                    ) + '/'
                )
            }
        );
        this.output(file, content.trim());
    }

    /**
     * build web app
     * @return {undefined}
     */
    buildTemplates() {
        let config = this.config;
        // build template wrap
        this.buildTemplateWrap(
            config.viewRoot + 'common/'
        );
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
     * build template wrap file
     * @param  {string} root - template root
     * @return {undefined}
     */
    buildTemplateWrap(root) {
        ['config.ftl', 'macro.ftl'].forEach((name) => {
            let file = root + name;
            if (!_fs.exist(file)) {
                logger.log('debug', {
                    data: [file],
                    message: 'output %s'
                });
                _fs.copy(__dirname + '/webapp/views/common/' + name, file);
            }
        });
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
            // 在构建模板mock数据时会用到这个变量
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
            if(config.mcss) {
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
                    path: this.parseFileName(
                        tpl.path, this.config.viewRoot
                    )
                })
            });
            ret = JSON.stringify(ret);
            // save rules
            this.rules.push({
                method: 'GET',
                path: it.path,
                mockDataPath: it.path.replace(/:/g, ''),
                list: ret,
                type: 'tpl',
                name: it.name
            });
        });
    }

    /**
     * build webapp files
     * @return {undefined}
     */
    buildWebAppArch() {
        let config = this.config;
        let root = config.webRoot;
        let temp = __dirname + '/webapp/web/';
        // build web app files
        let files = [
            '.bowerrc',
            'res/nej_blank.gif',
            'src/css/base.css',
            'src/javascript/widget/module.js',
            {
                name: 'bower.json',
                config: {
                    PRO_NAME: config.id,
                    freemarker: config.engine === 'freemarker'
                }
            }
        ];
        if (config.mcss) {
            files.push(
                'mcss.json',
                'src/mcss/_prefix.mcss',
                'src/mcss/_config.mcss',
                'src/mcss/base.mcss'
            );
        }
        files.forEach((it) => {
            let file = root + it;
            let content;
            if (typeof it !== 'string') {
                file = root + it.name;
                content = this.mergeTemplate(
                    this.options.tplRoot + (it.tpl || it.name),
                    it.config
                );
            }
            // check file exist
            if (_fs.exist(file)) {
                return logger.log('debug', {
                    data: [file],
                    message: 'file exist %s'
                });
            }
            // output file
            if (content != null) {
                this.output(file, content);
            } else {
                _fs.copy(temp + it, file);
            }
            logger.log('debug', {
                data: [file],
                message: 'output %s'
            });
        });
        // build webapp directory
        ['src/javascript/lib/'].forEach((it) => {
            it = root + it;
            _fs.mkdir(it);
            logger.log('debug', {
                data: [it],
                message: 'output %s'
            });
        });
    }

    /**
     * build web app
     * @return {undefined}
     */
    buildWebApp() {
        // build api mock data
        this.buildInterfaceMock(
            this.data.interfaces, {
                mockRoot: this.config.iMockRoot || (this.config.webRoot + 'src/mock/'),
                overwrite: this.options.overwrite,
                checkTime: this.options.checkTime,
                filter: this.options.tplRoot + 'filter.js'
            }
        );
        // build api mock filter
        this.buildInterfaceRules(this.data.interfaces);
    }

    /**
     * build local server config
     * @return {undefined}
     */
    buildServerConfig() {
        let config = this.config;
        let suffix = {
            freemarker: 'ftl',
            velocity: 'vm'
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
        let I_MOCK_ROOT;
        if (config.iMockRoot) {
            I_MOCK_ROOT = _path.normalize(
                path.relative(file, config.iMockRoot) + '/'
            );
        } else {
            I_MOCK_ROOT = webRoot + 'src/mock/';
        }
        // template mock dir path
        let T_MOCK_ROOT;
        if (config.tMockRoot) {
            T_MOCK_ROOT = _path.normalize(
                path.relative(file, config.tMockRoot) + '/'
            );
        } else {
            T_MOCK_ROOT = viewRoot + 'mock/';
        }

        let fmap = {
            'jtr.js.tpl': {
                fileName: 'jtr.js',
                rules: this.rules,
                WEB_ROOT: webRoot,
                VIEW_ROOT: viewRoot,
                VIEW_EXTENTION: suffix[config.engine] || 'ftl',
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
                _fs.addExecPermission(file + fileName);

            }
        });
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
        this.buildDeploy();
        this.buildWebAppArch();
        this.buildWebApp();
        this.buildTemplates();
        this.buildTemplateRules();
        this.buildServerConfig();
        this.diffJSONData();
        this.installBowerDeps();
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
        config.webRoot = config.webRoot.replace(config.outputRoot, './');
        config.viewRoot = config.viewRoot.replace(config.outputRoot, './');
    }
}

module.exports = WebAppBuilder;