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
let Builder = require('./lib/nei/builder');
let _logger = _log.logger;

class Main {

    /**
     * load data from nei server
     * @param {string|number} pid - nei project id
     * @param {function} callback - load success callback
     * @param {function} [errorCallback] - load error callback
     * @return {undefined}
     */
    loadData(pid, callback, errorCallback) {
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
                if (errorCallback) {
                    errorCallback();
                } else {
                    process.exit(1);
                }
            }
        });
    }

    /**
     * parse nei content to json
     * @param  {string} content - nei config string
     * @return {object|undefined}
     */
    parseData(content) {
        _logger.info('parse nei content');
        let ret;
        // parse content to json
        try {
            ret = JSON.parse(content);
        } catch (ex) {
            _logger.debug('content from nei \n%s', content);
            _logger.error('nei content parse error\n%s', ex.stack);
            return;
        }
        if (ret.code !== 200) {
            return _logger.error('illegal content from nei %j', ret);
        }
        // check result
        ret = ret.result;
        if (!ret.timestamp) {
            return _logger.error('illegal content from nei %j', ret);
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
        config.outputRoot = _path.absolute(config.project + '/', cwd);
        let existNeiConf = `${config.outputRoot}nei.${config.id}/nei.json`;
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
        this.loadData(config.id, (data) => {
            let Builder = require(name);
            let builder = new Builder(config);
            builder[action](data);
        });
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
                this.build(config);
            }
        });
    }

    /**
     * generator mock data
     * @param  {object}  config - config object
     * @return {undefined}
     */
    mock(config) {
        let cwd = process.cwd() + '/';
        config.outputRoot = _path.absolute(
            config.output + '/', cwd
        );
        this.loadData(config.id, (data) => {
            let builder = new Builder(config);
            builder.mock(data);
        });
    }

    /**
     * export toolkit config file
     * @param  {object}  config - config object
     * @return {undefined}
     */
    export(config) {
        let cwd = process.cwd() + '/';
        config.outputRoot = _path.absolute(
            config.output + '/', cwd
        );
        this.loadData(config.id, (data) => {
            let builder = new Builder(config);
            builder.export(data);
        });
    }

    /**
     * export mobile model and requests
     * @param  {object}  config - config object
     * @param  {Function} callback - build finish callback
     */
    mobile(config) {
        let cwd = process.cwd() + '/';
        config.outputRoot = _path.absolute(
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
        this.loadData(config.id, (data) => {
            let builder = new (require(`./lib/nei/mobile.${lang}.js`))(config);
            builder.model(data);
        });
    }
}

module.exports = new Main();


