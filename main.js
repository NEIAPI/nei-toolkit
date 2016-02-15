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
        _logger.info('load nei data from %s', api);
        _io.download(api, (data) => {
            let json = this.parseData(data);
            if (json) {
                callback(json);
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
     * parse nei string data to json
     * @param  {string} data - nei string data
     * @return {object|undefined}
     */
    parseData(data) {
        _logger.info('parse nei string data');
        let json;
        try {
            json = JSON.parse(data);
        } catch (ex) {
            _logger.debug('string data from nei \n%s', data);
            return _logger.error('nei string data parsing error\n%s', ex.stack);
        }
        if (json.code !== 200) {
            return _logger.error('illegal string data from nei %j', json);
        }
        json = json.result;
        if (!json.timestamp) {
            return _logger.error('illegal string data from nei %j', json);
        }
        return json;
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
        // check if exists nei.json file
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
            return _logger.error('no nei project found in %s', project);
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
     * generate mock data
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
     * export mobile models and requests
     * @param  {object}  config - config object
     * @return {undefined}
     */
    mobile(config) {
        let cwd = process.cwd() + '/';
        config.outputRoot = _path.absolute(
            config.output + '/', cwd
        );
        let lang = config.lang;
        if (!/^(oc|java)$/.test(lang)) {
            return _logger.error('not supported language %s', lang);
        }
        this.loadData(config.id, (data) => {
            let builder = new (require(`./lib/nei/mobile.${lang}.js`))(config);
            builder.model(data);
        });
    }
}

module.exports = new Main();


