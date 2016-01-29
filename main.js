/*
 * exports toolkit
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */
'use strict';

let fs = require('fs');
let util = require('util');
let _fs = require('./lib/util/file');
let _path = require('./lib/util/path');
let _io = require('./lib/util/io');
let _log = require('./lib/util/logger');
let _logger = _log.logger;

class Main {

    /**
     * load data from nei server
     * @param {string} pid - nei project id
     * @return {undefined}
     */
    loadData(pid, callback) {
        let api = util.format(
            (require('./package.json').nei || {}).api,
            pid
        );
        _logger.info('load nei config from %s', api);
        _io.download(api, (content) => {
            let data = this.parseData(content);
            if (data) {
                callback(data);
            } else {
                process.exit(1);
            }
        });
    }
    /**
     * parse nei config object
     * @param  {string} content - nei config string
     * @return {object|undefined}
     */
    parseData(content) {
        _logger.info('parse nei config');
        let ret;
        // parse content to json
        try {
            ret = JSON.parse(content);
        } catch (ex) {
            _logger.debug('content from nei \n%s', content);
            _logger.error('nei config parse error\n%s', ex.stack);
            return;
        }
        if (ret.code !== 200) {
            return _logger.error('illegal config data from nei %j', ret);
        }
        // check result
        ret = ret.result;
        if (!ret.timestamp) {
            return _logger.error('illegal config data from nei %j', ret);
        }
        return ret;
    }
    /**
     * build nei project
     * @param  {object}  config - config object
     * @return {undefined}
     */
    build(config) {
        let cwd = process.cwd() + '/';
        let outPath;
        if (config.project !== './') {
            // check `project` first, not default value
            outPath = config.project;
        } else {
            outPath = config.out;
        }
        config.outRoot = _path.absolute(outPath + '/', cwd);
        let existNeiConf = `${config.outRoot}nei.${config.id}/nei.json`;
        let action = config.action;
        // check nei.json file
        let msg;
        if (_fs.exist(existNeiConf)) {
            if (action === 'build') {
                msg = 'use "nei update" to update nei project with id[%s]';
            }
        } else {
            if (action === 'update') {
                msg = 'use "nei build" to build nei project with id[%s]';
            }
        }
        if (msg) {
            _logger.error(msg, config.id);
            return process.exit(1);
        }
        // generator config
        let existConf = {};
        if (action === 'update') {
            existConf = require(existNeiConf);
        } else {
            existConf.updateTime = 0;
        }
        config = Object.assign(existConf, config);
        let name;
        if (config.template === 'mobile') {
            name = `./lib/nei/mobile.${config.lang}.js`;
        } else {
            name = './lib/nei/webapp.js';
        }
        let Builder = require(name);
        let builder = new Builder(config);
        this.loadData(config.id, (data) => {
            builder[action](data);
        })
    }

    /**
     * update nei project
     * @param  {object}  config - config object
     * @return {undefined}
     */
    update(config) {
        let cwd = process.cwd() + '/';
        let project = _path.absolute(
            config.project + '/', cwd
        );
        let list = fs.readdirSync(project);
        if (!list || !list.length) {
            _logger.error('no nei project found in %s', project);
            return process.exit(1);
        }
        _logger.error('check to update all nei project');
        // check nei config directory
        let reg = /^nei\.([\d]+)$/;
        list.forEach((name) => {
            if (_fs.isdir(project + name + '/') && reg.test(name)) {
                config.id = RegExp.$1;
                this.nei(config);
            }
        });
    }

    /**
     * generator mock data
     * @param  {object}  config - config object
     * @param  {Function} callback - build finish callback
     */
    mock(config, callback) {
        let cwd = process.cwd() + '/';
        let output = _path.absolute(
            config.output + '/', cwd
        );
        (new (require('./lib/nei/builder.js'))({
            id: config.id,
            outRoot: output,
            overwrite: config.overwrite,
            done: callback || function () {
            },
            debug: _log.log.bind(_log, 'debug'),
            info: _log.log.bind(_log, 'info'),
            warn: _log.log.bind(_log, 'warn'),
            error: _log.log.bind(_log, 'error')
        })).mock(config);
    }

    /**
     * export toolkit config file
     * @param  {object}  config - config object
     * @param  {Function} callback - build finish callback
     */
    export(config, callback) {
        let cwd = process.cwd() + '/';
        let output = _path.absolute(
            config.output + '/', cwd
        );
        (new (require('./lib/nei/builder.js'))({
            id: config.id,
            outRoot: output,
            overwrite: config.overwrite,
            done: callback || function () {
            },
            debug: _log.log.bind(_log, 'debug'),
            info: _log.log.bind(_log, 'info'),
            warn: _log.log.bind(_log, 'warn'),
            error: _log.log.bind(_log, 'error')
        })).export({
                type: config.type,
                domain: config.domain
            });
    }

    /**
     * export mobile model and requests
     * @param  {object}  config - config object
     * @param  {Function} callback - build finish callback
     */
    mobile(config, callback) {
        let cwd = process.cwd() + '/';
        let output = _path.absolute(
            config.output + '/', cwd
        );
        let lang = config.lang;
        // check language
        if (!/^(oc|java)$/.test(lang)) {
            _log.log('error', {
                data: [lang],
                message: 'not supported language %s'
            });
            return process.exit(1);
        }
        (new (require(`./lib/nei/mobile.${lang}.js`))({
            id: config.id,
            outRoot: output,
            overwrite: config.overwrite,
            done: callback || function () {
            },
            debug: _log.log.bind(_log, 'debug'),
            info: _log.log.bind(_log, 'info'),
            warn: _log.log.bind(_log, 'warn'),
            error: _log.log.bind(_log, 'error')
        })).model(
            config
        );
    }
}

module.exports = new Main();


