/*
 * io with cache utility api
 * @module   util/io
 * @author   genify(caijf@corp.netease.com)
 */
var util = require('util'),
    path = require('path'),
   _fs   = require('../util/file.js'),
   _path = require('../util/path.js'),
   _util = require('../util/util.js');
// private variable
var _gCache = {},
    _gDwnState = {},
    _gListener = [],
    _gOutState = {},
    _gOutListener = [];
// add event
var _addEvent = function(cache,listeners,callback){
    // push to listener cache
    if (listeners.indexOf(callback)<0){
        listeners.push(callback);
    }
    // check loading state
    if (Object.keys(cache).length<=0){
        callback();
    }
};
// remove event
var _removeEvent = function(listeners,callback){
    var index = listeners.indexOf(callback);
    if (index>=0){
        listeners.splice(index,1);
    }
};
// check event trigger
var _checkEvent = function(cache,listener){
    if (Object.keys(cache).length<=0){
        listener.forEach(function(callback){
            try{
                callback();
            }catch(ex){
                console.error(ex.stack);
            }
        });
    }
};
/**
 * dump file content cache
 * @return {Object} file content cache
 */
exports.dump = function(){
    return _gCache;
};
/**
 * add onload event for io
 * @param  {Function} callback - onload callback
 * @return {Void}
 */
exports.onload = function(callback){
    _addEvent(_gDwnState,_gListener,callback);
};
/**
 * remove onload callback
 * @param  {Function} callback - onload callback
 * @return {Void}
 */
exports.offload = function(callback){
    _removeEvent(_gListener,callback);
};
/**
 * get resource content with uri
 * @param  {String}   uri      - resource uri
 * @param  {Function} callback - callback if resource loaded from fs or server
 * @return {Boolean}  whether uri loading queue
 */
exports.get = (function(){
    // format content
    var _doFormatContent = function(uri,content,callback){
        var event = {value:content};
        // pre process file content
        // update file content in callback
        try{
            callback(event);
        }catch(ex){
            // ignore
            console.error(ex.stack);
        }
        this.cache(uri,event.value);
    };
    // check download state
    var _doCheckDownloadState = function(){
        _checkEvent(_gDwnState,_gListener);
    };
    return function(uri,callback,charset){
        // check cache
        var content = this.getFromCache(uri);
        if (content!=null||!!_gDwnState[uri]){
            return !0;
        }
        // download file content
        _gDwnState[uri] = !0;
        var handler = function(content){
            content = content||'';
            if (util.isArray(content)){
                content = content.join('\n');
            }
            _doFormatContent.call(
                this,uri,content,callback
            );
            delete _gDwnState[uri];
            _doCheckDownloadState();
        }.bind(this);
        // load file from file system or remote server
        try{
            if (!_path.isURL(uri)){
                _fs.readAsync(uri,handler,charset);
            }else{
                this.download(uri+'?v='+(+new Date),handler);
            }
        }catch(ex){
            handler("cant load file "+uri+' for '+ex.message+'\n'+ex.stack);
            console.error(ex.stack);
        }
    };
})();
/**
 * get resource content from cache
 * @param  {String} uri - resource uri
 * @return {String} resource content
 */
exports.getFromCache = function(uri){
    return _gCache[uri];
};
/**
 * cache resource content
 * @param  {String} uri     - resource uri
 * @param  {String} content - resource content
 * @return {Void}
 */
exports.cache = function(uri,content){
    _gCache[uri] = content;
};
/**
 * fill uri list with content
 * @param  {Array}  list - uri list
 * @param  {String} sep  - list separate char
 * @return {String} content of list
 */
exports.fill = function(list,sep){
    var ret = [];
    (list||[]).forEach(function(uri){
        var content = this.getFromCache(uri)||'';
        if (!!content){
            ret.push(content);
        }
    },this);
    return ret.join(sep||'\n');
};
/**
 * download content from server
 * @param  {String}   uri      - resource content
 * @param  {Function} callback - callback after resource loaded
 * @return {Void}
 */
exports.download = function(uri,callback){
    var https = /^https:\/\//i.test(uri);
    require(https?'https':'http').get(
        uri,function(res){
            var ret = [];
            res.on('data',function(chunk){
                ret.push(chunk.toString());
            });
            res.on('end',function(){
                callback(ret.join(''));
            });
        }
    ).on(
        'error',function(error){
            callback(util.format(
                'download file %s error, cause:\n%s',
                uri,error.message
            ));
        }
    );
};
/**
 * add output done event
 * @param  {Function} callback - done callback
 * @return {Void}
 */
exports.ondone = function(callback){
    _addEvent(_gOutState,_gOutListener,callback);
};
/**
 * remove output done event
 * @param  {Function} callback - done callback
 * @return {Void}
 */
exports.offdone = function(callback){
    _removeEvent(_gOutListener,callback);
};
/**
 * output file content
 * @param  {String} file    - file path
 * @param  {String} content - file content
 * @param  {String=} charset - charset
 * @return {Void}
 */
exports.output = function(file,content,charset){
    var id = file+'v'+_util.increment();
    _gOutState[id] = !0;
    _fs.mkdir(path.dirname(file));
    _fs.writeAsync(
        file,content,charset,
        function(){
            delete _gOutState[id];
            _checkEvent(_gOutState,_gOutListener);
        }
    );
};
/**
 * save resource version
 * @param  {String} uri - uri
 * @param  {String} version - version
 * @return {Void}
 */
exports.resource = function(uri,version){
    var cache = _gCache.resources;
    if (!cache){
        cache = {};
        _gCache.resources = cache;
    }
    cache[uri] = version;
};
/**
 * dump resource version cache
 * @return {Object} version cache
 */
exports.dumpResource = function(){
    return _gCache.resources||{};
};