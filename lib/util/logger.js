/*
 * logger utility api
 * @module   util/logger
 * @author   genify(caijf@corp.netease.com)
 * @author   huntbao
 */
'use strict';

let util = require('util');
let EventEmitter = require('events');
let _util = require('./util.js');

// level config
const LEVEL = {
    ALL: 100,
    DEBUG: 4,
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    OFF: -1
};

class Logger {
    /**
     * @param  {object} [config] - config parameters
     * @return {undefined}
     */
    constructor(config) {
        this._cache = [];
        if (config) {
            this.setLevel(config.level);
        }
    }

    /**
     * set logger level
     * @param  {string} level - logger level
     * @return {undefined}
     */
    setLevel(level) {
        if (level == null) {
            return;
        }
        // check level
        if (typeof level === 'string') {
            level = LEVEL[(level || '').toUpperCase()];
        }
        if (!level) {
            level = LEVEL.ALL;
        }
        this._level = level;
        // dump log cache
        if (this._cache.length > 0) {
            let ret = [];
            this._cache.forEach((it) => {
                if (it.level <= level) {
                    ret.push(it.message);
                }
            });
            this._cache = [];
            this.log({
                message: ret.join('\n')
            });
        }
    }

    /**
     * dump cache log to file
     * @param  {string} file - log file path
     * @return {undefined}
     */
    dump2file(file) {
        if (this._cache.length > 0) {
            let ret = [];
            this._cache.forEach(function (it) {
                ret.push(it.message);
            });
            require('fs').appendFileSync(
                file, ret.join('\n')
            );
            this._cache = [];
        }
    }

    /**
     * log information
     * @return {undefined}
     */
    log() {
        this.info.apply(this, arguments);
    }

    /**
     * log debug information
     * @return {undefined}
     */
    debug() {
        let args = [].slice.call(
            arguments, 0
        );
        args.unshift('debug');
        this._log.apply(this, args);
    }

    /**
     * log information
     * @return {undefined}
     */
    info() {
        let args = [].slice.call(
            arguments, 0
        );
        args.unshift('info');
        this._log.apply(this, args);
    }

    /**
     * log warning information
     * @return {undefined}
     */
    warn() {
        let args = [].slice.call(
            arguments, 0
        );
        args.unshift('warn');
        this._log.apply(this, args);
    };

    /**
     * log error information
     * @return {undefined}
     */
    error() {
        let args = [].slice.call(
            arguments, 0
        );
        args.unshift('error');
        this._log.apply(this, args);
    }

    /**
     * log information
     * @param  {string} level - logger level
     * @return {undefined}
     */
    _log(level) {
        level = (level || '').toUpperCase();
        // format log text
        let args = [].slice.call(arguments, 1);
        var time = _util.getFormatTime('%s-%s-%s %s:%s:%s.%s');
        args[0] = util.format('[%s] %s - %s', level.charAt(0), time, args[0]);
        let event = {
            level: LEVEL[level] || LEVEL.INFO,
            message: util.format.apply(util, args)
        };
        // cache log info if not level config
        if (this._level == null) {
            this._cache.push(event);
            return console.log(event.message);
        }
        // check level
        if (event.level > this._level) {
            return;
        }
        this.log(event);
    }
}

// export api
exports.level = LEVEL;

exports.Logger = Logger;

exports.logger = new Logger();

exports.log = function (type, event) {
    let func = this.logger[type];
    if (func) {
        let args = event.data || [];
        args.unshift(event.message || '');
        func.apply(this.logger, args);
    }
};