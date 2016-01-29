/*
 * exports toolkit
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */
// klass exports map
//let KLASS = {
//    // base klass
//    Event: 'util/event',
//    Logger: 'util/logger#Logger',
//    // nei builder
//    NEI_Builder: 'nei/builder',
//    NEI_WebApp: 'nei/webapp',
//    NEI_Mobile: 'nei/mobile'
//};
//// api exports map
//let API = {
//    io: 'util/io',
//    rg: 'util/args',
//    fs: 'util/file',
//    ps: 'util/path',
//    ut: 'util/util',
//    ks: 'util/klass',
//    lg: 'util/logger#level,logger,log'
//};
//// export klass or api
//function global(map) {
//    Object.keys(map).forEach(function (key) {
//        let file = map[key];
//        let arr = file.split('#');
//        let mdl = require('./lib/' + arr[0] + '.js');
//        // for util/logger#Logger
//        if (!!arr[1]) {
//            // for util/logger#level,logger
//            let brr = arr[1].split(',');
//            if (brr.length > 1) {
//                let ret = {};
//                brr.forEach(function (name) {
//                    ret[name] = mdl[name];
//                });
//                mdl = ret;
//            } else {
//                mdl = mdl[brr[0]];
//            }
//        }
//        exports[key] = mdl;
//    });
//}
//// export constructor
//// export api
//global(KLASS);
//global(API);

'use strict';
// bin api
let fs = require('fs');
let util = require('util');
let _fs = require('./lib/util/file.js');
let _path = require('./lib/util/path.js');
let _log = require('./lib/util/logger.js');
let _logger = _log.logger;

class Main {
    /**
     * build nei project
     * @param  {Object}  config - config object
     * @return {Undefined}
     */
    build(config) {
        let cwd = process.cwd() + '/';
        config.proRoot = _path.absolute(
            config.project + '/', cwd
        );
        let existNeiConf = `${config.proRoot}nei.${config.id}/nei.json'`;
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
        builder.on('done', () => {
            process.exit(0);
        });
        builder[action]();
    }

    /**
     * update nei project
     * @param  {Object}  config - config object
     * @return {Void}
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
     * @param  {Object}  config - config object
     * @param  {Function} callback - build finish callback
     */
    mock(config, callback) {
        let cwd = process.cwd() + '/';
        let output = _path.absolute(
            config.output + '/', cwd
        );
        (new (require('./lib/nei/builder.js'))({
            id: config.id,
            proRoot: output,
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
     * @param  {Object}  config - config object
     * @param  {Function} callback - build finish callback
     */
    export(config, callback) {
        let cwd = process.cwd() + '/';
        let output = _path.absolute(
            config.output + '/', cwd
        );
        (new (require('./lib/nei/builder.js'))({
            id: config.id,
            proRoot: output,
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
     * @param  {Object}  config - config object
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
            proRoot: output,
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


