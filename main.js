/*
 * exports toolkit
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */
'use strict';

let fs = require('fs');
let util = require('util');
let path = require('path');
var jtr = require('jtr');
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
        if (config.deployRoot) {
            config.deployRoot = _path.absolute(config.deployRoot + '/', config.outputRoot);
        }
        if (config.tMockRoot) {
            config.tMockRoot = _path.absolute(config.tMockRoot + '/', config.outputRoot);
        }
        if (config.iMockRoot) {
            config.iMockRoot = _path.absolute(config.iMockRoot + '/', config.outputRoot);
        }
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
        }, () => {
            // 如果从 nei 上下载数据失败, 构建空工程
            _logger.warn('Error happened while loading data from nei, start building empty project...');
            this.buildEmpty(config);
        });
    }

    /**
     * build empty mobile project
     * @param  {object}  config - config object
     * @return {undefined}
     */
    buildEmpty(config) {
        let cwd = process.cwd() + '/';
        config.outputRoot = _path.absolute(config.project + '/', cwd);
        let name = `./lib/nei/mobile.${config.lang}.js`;
        let Builder = require(name);
        let builder = new Builder(config);
        builder.build();
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

    /**
     * start mock server
     * @param  {object}  config - config object
     * @return {undefined}
     */
    server(config) {
        let tryStartServer = (configPath) => {
            if (_fs.exist(configPath)) {
                let options = Object.create(null);
                options.config = require(configPath);
                options.fromNei = true;
                // start server
                jtr(options);
            } else {
                _logger.warn(`can't find jtr config file at: ${configPath}`);
            }
        }
        if (config.configFile) {
            let configFilePath = _path.absolute(
              config.configFile, process.cwd() + '/'
            );
            return tryStartServer(configFilePath);
        }
        let dir = path.join(process.cwd(), config.path);
        if (_fs.exist(dir)) {
            if (config.id) {
                let jtrConfigPath = path.join(dir, `nei.${config.id}/jtr.js`);
                tryStartServer(jtrConfigPath);
            } else {
                // try to find jtr config file in `nei.{pid}` dir
                let list = fs.readdirSync(dir);
                let configFileFound = false;
                for(let i = 0, l = list.length; i < l; i++) {
                    let p = `${dir}/${list[i]}`;
                    if (_fs.isdir(p)) {
                        if (list[i].match(/nei/)) {
                            configFileFound = true;
                            tryStartServer(`${p}/jtr.js`);
                            break;
                        }
                    } else if (list[i] === 'jtr.js') {
                        configFileFound = true;
                        tryStartServer(p);
                        break;
                    }
                }
                if (!configFileFound) {
                    _logger.warn(`can't find jtr config file`)
                }
            }
        } else {
            _logger.warn(`project directory(${dir}) does not exist`)
        }
    }
}

module.exports = new Main();


