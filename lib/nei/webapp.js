/*
 * WebApp Builder
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */
'use strict';

let path = require('path');
let util = require('util');
let _fs = require('../util/file');
let _path = require('../util/path');
let Builder = require('./builder');
let log = require('../util/logger').logger;

// template root
const TPL_ROOT = __dirname + '/webapp/template/';

class WebAppBuilder extends Builder {
    /**
     * class constructor
     * @param  {object} config - config parameters
     * @return {undefined}
     */
    constructor(config) {
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
                this.config.proRoot
            ),
            viewRoot: _path.absolute(
                this.config.viewRoot || './src/main/webapp/WEB-INF/views/',
                this.config.proRoot
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
     * @private
     * @param  {Object} config - config object
     * @param  {Object} options - build options
     * @return {undefined}
     */
    buildDeploy(config, options) {
        // build deploy
        let file = _path.absolute(
            './deploy/release.' + config.id + '.conf',
            config.proRoot
        );
        // check file exist
        if (_fs.exist(file)) {
            return;
        }
        // output deploy config
        let content = this.mergeTemplate(
            TPL_ROOT + 'release.conf', {
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
     * @param  {Object} config - config object
     * @param  {Object} options - build options
     * @param  {Object} data - nei config data
     * @return {undefined}
     */
    buildTemplates(config, options, data) {
        // build template wrap
        this.buildTemplateWrap(
            config.viewRoot + 'common/'
        );
        // build template page
        this._buildTemplatePage(
            data.templates, config
        );
        // build template mock
        this.buildTemplateMock(
            data.templates, {
                mockRoot: config.viewRoot + 'mock/',
                overwrite: options.overwrite,
                checkTime: options.checkTime,
                filter: TPL_ROOT + 'filter.js'
            }
        );
        // build page rules
        this.buildTemplateRules(
            data.pages, {
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
                this.emit('debug', {
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
    _buildTemplatePage(list, config) {
        let web = config.webRoot,
            root = config.viewRoot;
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
                return this.emit('debug', {
                    data: [file],
                    message: 'page exist %s'
                });
            }
            // generate template file content
            let content = this.mergeTemplate(
                TPL_ROOT + 'page.ftl', {
                    filename: filename,
                    title: it.name || '页面标题',
                    description: it.description || '页面描述'
                }
            );
            this._output(file, content);
            // build page style
            file = util.format(
                '%ssrc/css/%s.css',
                web, filename
            );
            this._output(file, '');
            // build page mcss code
            file = util.format(
                '%ssrc/mcss/%s.mcss',
                web, filename
            );
            this._output(file, '');
            // build page script
            file = util.format(
                '%ssrc/javascript/%s.js',
                web, filename
            );
            content = this.mergeTemplate(
                TPL_ROOT + 'page.js', {
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
                method: this.parseReqMethod(it.method)
            });
        });
    }

    /**
     * build webapp files
     * @param  {Object} config - config object
     * @return {undefined}
     */
    buildWebAppArch(config) {
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
                        TPL_ROOT + (it.tpl || it.name),
                        it.config
                    );
                }
                // check file exist
                if (_fs.exist(file)) {
                    return this.emit('debug', {
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
                this.emit('debug', {
                    data: [file],
                    message: 'output %s'
                });
            });
        // build webapp directory
        ['src/javascript/lib/'].forEach((it) => {
            it = root + it;
            _fs.mkdir(it);
            this.emit('debug', {
                data: [it],
                message: 'output %s'
            });
        });
    }

    /**
     * build web app
     * @private
     * @param  {Object} config - config object
     * @param  {Object} options - build options
     * @param  {Object} data - nei config data
     * @return {undefined}
     */
    buildWebApp(config, options, data) {
        // build api mock data
        this.buildInterfaceMock(
            data.interfaces, {
                mockRoot: config.webRoot + 'src/mock/',
                overwrite: options.overwrite,
                checkTime: options.checkTime,
                filter: TPL_ROOT + 'filter.js'
            }
        );
        // build api mock filter
        this.buildInterfaceRules(
            data.interfaces, {
                mockRoot: config.webRoot + 'src/mock/'
            }
        );
    }

    /**
     * build local server config
     * @private
     * @param  {Object} config - config object
     * @return {undefined}
     */
    buildServerConfig(config) {
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
                TPL_ROOT + name, fmap[name]
            );
            this.output(file + name, content);
        });
    }

    /**
     * build project
     * @param  {Object}  config - config object, parameters return from this.config api
     * @param  {Object}  options - build options
     * @param  {Object}  data - data config from nei platform
     * @return {undefined}
     */
    _build(config, options, data) {
        this.buildDeploy(config, options);
        this.buildWebAppArch(config);
        this.buildWebApp(config, options, data);
        this.buildTemplates(config, options, data);
        this.buildServerConfig(config);
    }

    /**
     * update project
     * @param  {Object}  config - config object, parameters return from this.config api
     * @param  {Number}  config.id - project id
     * @param  {Object}  options - update options
     * @param  {Object}  data - data config from nei platform
     * @return {undefined}
     */
    _update(config, options, data) {
        this.buildWebApp(config, options, data);
        this.buildTemplates(config, options, data);
        this.buildServerConfig(config);
    }

    /**
     * do something before build done
     * @param  {Object} config - nei config will be outputted
     * @return {undefined}
     */
    _beforeDone(config) {
        config.webRoot = config.webRoot.replace(
            config.proRoot, './'
        );
        config.viewRoot = config.viewRoot.replace(
            config.proRoot, './'
        );
    }
}

module.exports = WebAppBuilder;
