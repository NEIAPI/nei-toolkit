/*
 * Abstract Class with Event Emitter
 * @module   event
 * @author   genify(caijf@corp.netease.com)
 */
var _util = require('./util.js');
// Abstract Event Class
var Event = module.exports =
    require('./klass.js').create();
var pro = Event.prototype;
/**
 * class initialization
 * @param  {Object} config - config parameters
 * @return {Void}
 */
pro.init = function(config){
    this._listeners = {};
    config = config||{};
    Object.keys(config).forEach(
        function(key){
            if (_util.isFunction(config[key])){
                this.on(key,config[key]);
            }
        },this
    );
};
/**
 * add event listener
 * @param  {String}   name  - event name
 * @param  {Function} event - event handler
 * @return {Void}
 */
pro.add = function(name,event){
    // check function
    if (!_util.isFunction(event)){
        return;
    }
    // cache event handler
    var ret = this._listeners[name];
    if (!ret){
        ret = [];
        this._listeners[name] = ret;
    }
    ret.push(event);
};
/**
 * overwrite event listener
 * @param  {String}   name  - event name
 * @param  {Function} event - event handler
 * @return {Void}
 */
pro.on = function(name,event){
    // check function
    if (!_util.isFunction(event)){
        return;
    }
    this._listeners[name] = [event];
};
/**
 * remove event handler
 * @param  {String}   name  - event name
 * @param  {Function} event - event handler
 * @return {Void}
 */
pro.off = function(name,event){
    var ret = this._listeners[name];
    if (!ret){
        return;
    }
    // remove all if not pass event
    if (!event){
        delete this._listeners[name];
        return;
    }
    // remove one event
    var index = ret.indexOf(event);
    if (index>=0){
        ret.splice(index,1);
    }
};
/**
 * remove all listeners
 * @return {Void}
 */
pro.removeAllListeners = function(){
    this._listeners = {};
};
/**
 * emit event with config
 * @param  {String} name   - event name
 * @param  {Object} config - event config
 * @return {Void}
 */
pro.emit = function(name,config){
    var ret = this._listeners[name];
    if (!!ret){
        ret.forEach(function(func){
            try{
                func.call(this,config);
            }catch(ex){
                console.error(ex.stack);
            }
        },this);
    }
};
/**
 * dump logger event config
 * @return {Object} logger event config
 */
pro.getLogger = function(){
    var ret = {};
    ['debug','info','warn','error'].forEach(
        function(name){
            var list = this._listeners[name];
            if (!!list&&list.length>0){
                ret[name] = list[0];
            }
        },this
    );
    return ret;
};