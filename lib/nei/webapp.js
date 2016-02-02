/*
 * WebApp Builder
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
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
        const TPL_ROOT =  __dirname + '/webapp/template/';
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
     * @protected
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
     * build deploy config
     * @return {undefined}
     */
    buildDeploy() {
        let config = this.config;
        // build deploy
        let file = _path.absolute(
            './deploy/release.' + config.id + '.conf',
            config.outputRoot
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
            this.data.templates, config
        );
        // build template mock
        this.buildTemplateMock(
            this.data.templates, {
                mockRoot: config.viewRoot + 'mock/',
                overwrite: this.options.overwrite,
                checkTime: this.options.checkTime,
                filter: this.options.tplRoot + 'filter.js'
            }
        );
        // build page rules
        this.buildTemplateRules(
            this.data.pages, {
                viewRoot: config.viewRoot
            }
        );
    }

    /**
     * build template wrap file
     * @param  {String} root - template root
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
     * @param  {Array}  list - template definition list
     * @param  {Object} config - config object
     * @return {undefined}
     */
    buildTemplatePage(list, config) {
        let web = config.webRoot;
        var root = config.viewRoot;
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
            // check page exist
            if (_fs.exist(file)) {
                return logger.log('debug', {
                    data: [file],
                    message: 'page exist %s'
                });
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
            // build page mcss code
            file = util.format(
                '%ssrc/mcss/%s.mcss',
                web, filename
            );
            this.output(file, '');
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
     * @private
     * @param  {Array}  list - page definition list
     * @param  {Object} config - config object
     * @param  {String} config.viewRoot - template root path
     * @return {undefined}
     */
    buildTemplateRules(list, config) {
        let root = config.viewRoot;
        var cache = this.tplMap || {};
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
                    i: id,
                    p: tpl.mock
                })
            });
            // save rules
            this._rules.push({
                method: 'GET',
                path: it.path,
                func: util.format(
                    'u.r(0,%s)',
                    JSON.stringify(ret)
                )
            });
        });
    }

    /**
     * build mock filter
     * @private
     * @param  {Array}   list - interface list
     * @return {undefined}
     */
    buildInterfaceRules(list) {
        (list || []).forEach((it) => {
            this._rules.push({
                path: it.path,
                func: `u.p(${it.id},"${it.mock.replace(/^\//, '')}")`,
                method: this.getReqMethod(it.method)
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
        var temp = __dirname + '/webapp/web/';
        // build web app files
        [
            '.bowerrc',
            'mcss.json',
            'res/nej_blank.gif',
            'src/css/base.css',
            'src/javascript/widget/module.js',
            'src/mcss/_prefix.mcss',
            'src/mcss/_config.mcss',
            'src/mcss/base.mcss',
            {
                name: 'bower.json',
                config: {
                    PRO_NAME: config.id,
                    freemarker: config.engine === 'freemarker'
                }
            }
        ].forEach((it) => {
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
                mockRoot: this.config.webRoot + 'src/mock/',
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
        let fmap = {
            'util.js': {
                check: !0,
                VIEW_ROOT: viewRoot,
                VIEW_EXTENTION: suffix[config.engine] || 'js',
                MOCK_WEB: webRoot + 'src/mock/',
                NEI_MOCK_API: (require('../../package.json').nei || {}).mock
            },
            'route.js': {
                rules: this._rules
            },
            'puer.js': {
                check: !0,
                WEB_ROOT: webRoot,
                VIEW_ROOT: viewRoot,
                freemarker: config.engine === 'freemarker'
            },
            'server.bat': {
                check: !0,
                WEB_ROOT: webRoot
            },
            'server.sh': {
                check: !0,
                WEB_ROOT: webRoot
            }
        };
        // output server config
        Object.keys(fmap).forEach((name) => {
            // check file exist
            if (fmap[name].check && _fs.exist(file + name)) {
                return;
            }
            // output file
            let content = this.mergeTemplate(
                this.options.tplRoot + name, fmap[name]
            );
            this.output(file + name, content);
        });
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
        this.buildServerConfig();
        this.diffJSONData();
    }

    /**
     * update project
     * @return {undefined}
     */
    updateStart() {
        console.log(this.config)
        console.log('===========')
        this.buildWebApp();
        this.buildTemplates();
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
