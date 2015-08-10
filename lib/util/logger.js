/*
 * logger utility api
 * @module   util/logger
 * @author   genify(caijf@corp.netease.com)
 */
var util = require('util'),
   _util = require('./util.js');
// level config
var LEVEL = {
    ALL   :  100,
    DEBUG :  4,
    INFO  :  3,
    WARN  :  2,
    ERROR :  1,
    OFF   : -1
};
// logger constructor
// level    log level
// log      log output handler
var Logger = require('./klass.js').create();
var pro = Logger.extend(require('./event.js'));
/**
 * class initialization
 * @param  {Object} config - config parameters
 * @return {Void}
 */
pro.init = function(config){
    this._super(config);
    this._cache = [];
    // init config
    if (!!config){
        this.setLevel(config.level);
    }
};
/**
 * update logger config
 * @param  {Object} config - logger config
 * @return {Void}
 */
pro.setLevel = function(level){
    if (level==null){
        return;
    }
    // check level
    if (typeof level==='string'){
        level = LEVEL[(level||'').toUpperCase()];
    }
    if (!level){
        level = LEVEL.ALL;
    }
    this._level = level;
    // dump log cache
    if (this._cache.length>0){
        var ret = [];
        this._cache.forEach(function(it){
            if (it.level<=level){
                ret.push(it.message);
            }
        });
        this._cache = [];
        this.emit('log',{
            message:ret.join('\n')
        });
    }
};
/**
 * dump cache log to file
 * @param  {String} file - log file path
 * @return {Void}
 */
pro.dump2file = function(file){
    if (this._cache.length>0){
        var ret = [];
        this._cache.forEach(function(it){
            ret.push(it.message);
        });
        require('fs').appendFileSync(
            file,ret.join('\n')
        );
        this._cache = [];
    }
};
/**
 * log information
 * @return {Void}
 */
pro.log = function(){
    this.info.apply(this,arguments);
};
/**
 * log debug information
 * @return {Void}
 */
pro.debug = function(){
    var args = [].slice.call(
        arguments,0
    );
    args.unshift('debug');
    this._log.apply(this,args);
};
/**
 * log information
 * @return {Void}
 */
pro.info = function(){
    var args = [].slice.call(
        arguments,0
    );
    args.unshift('info');
    this._log.apply(this,args);
};
/**
 * log warning information
 * @return {Void}
 */
pro.warn = function(){
    var args = [].slice.call(
        arguments,0
    );
    args.unshift('warn');
    this._log.apply(this,args);
};
/**
 * log error information
 * @return {Void}
 */
pro.error = function(){
    var args = [].slice.call(
        arguments,0
    );
    args.unshift('error');
    this._log.apply(this,args);
};
/**
 * log information
 * @private
 * @param  {String} level - logger level
 * @return {Void}
 */
pro._log = function(level){
    level = (level||'').toUpperCase();
    // format log text
    var args = [].slice.call(arguments,1),
        time = _util.getFormatTime('%s-%s-%s %s:%s:%s.%s');
    args[0] = util.format('[%s] %s - %s',level.charAt(0),time,args[0]);
    var event = {
        level:LEVEL[level]||LEVEL.INFO,
        message:util.format.apply(util,args)
    };
    // cache log info if not level config
    if (this._level==null){
        this._cache.push(event);
        console.log(event.message);
        return;
    }
    // check level
    if (event.level>this._level){
        return;
    }
    // emit log event to show log info
    this.emit('log',event);
};

// export api
exports.level  = LEVEL;
exports.Logger = Logger;
exports.logger = new Logger({
    log:function(event){
        console.log(event.message);
    }
});
exports.log = function(type,event){
    var func = this.logger[type];
    if (!!func){
        var args = event.data||[];
        args.unshift(event.message||'');
        func.apply(this.logger,args);
    }
};