/*
 * path utility api
 * @module   util/path
 * @author   genify(caijf@corp.netease.com)
 */
var ph   = require('path'),
    util = require('util'),
    reg  = /^(https|http|ftp|mailto|file):\//i;
/**
 * format path
 * @param  {String} path - original file path
 * @return {String} file path after formatted
 */
exports.normalize = function(path){
    path = ph.normalize(path||'./').replace(/[\\/]+/g,'/');
    // fix http:/a.b.com -> http://a.b.com
    return path.replace(reg,'$1://');
};
/**
 * absolute url path
 * @param  {String} url  - original url
 * @param  {String} root - root relative to
 * @return {String} absolute path
 */
exports.absoluteURL = function(url,root){
    if (this.isURL(url)){
        return this.normalize(url);
    }
    url = url||'';
    root = root||'';
    // http://a.b.com:4040/a/b/
    var arr = root.split('/'),
        // http://a.b.com:4040
        host = arr.slice(0,3).join('/'),
        // /a/b/
        path = '/'+arr.slice(3,arr.length).join('/');
    // /c/d or c/d is relative
    if (url.indexOf('/')!=0&&
        url.indexOf(':')<0){
        url = path+url;
    }
    return host+this.normalize(url);
};
/**
 * absolute file path
 * @param  {String} url  - original url
 * @param  {String} root - root relative to
 * @return {String} absolute path
 */
exports.absolutePath = function(path,root){
    // fix end path's \r on mac
    path = (path||'').replace(/\r$/,'');
    // a/b -> ./a/b
    // c:/a/b -> c:/a/b
    if (path.search(/[./]/)!=0&&
        path.indexOf(':')<0){
        path = './'+path;
    }
    // /a/b is absolute
    // startwith ./ or ../
    if (path.indexOf('.')==0){
        path = (root||'')+path;
    }
    return this.normalize(path);
};
/**
 * absolute path with path root or web root
 * @param  {String} url      - original path
 * @param  {String} pathRoot - current path root
 * @param  {String} webRoot  - web root
 * @return {String} absolute path
 */
exports.absoluteAltRoot = function(url,pathRoot,webRoot){
    if (url.indexOf('/')==0){
        if (!!webRoot&&url.indexOf(webRoot)===0){
            return url;
        }
        return this.absolute('./'+url,webRoot);
    }
    return this.absolute(url,pathRoot);
};
/**
 * auto absolute path
 * @param  {String} url  - original url
 * @param  {String} root - root relative to
 * @return {String} absolute path
 */
exports.absolute = function(file,root){
    file = file||'';
    // check file completed
    if (!!root&&file.indexOf(root)===0){
        return file;
    }
    if (this.isURL(file)||this.isURL(root)){
        return this.absoluteURL(file,root);
    }
    return this.absolutePath(file,root);
};
/**
 * check if url path
 * @param  {String}  url - original path
 * @return {Boolean} whether url path
 */
exports.isURL = function(url){
    return reg.test(url);
};
/**
 * complete uri
 * @param  {String} uri - uri before complete
 * @param  {Object} config - config object
 * @param  {RegExp} config.aliasReg - replace regexp
 * @param  {Object} config.aliasDict - alias dictionary
 * @return {String} uri after complete
 */
exports.completeURI = function(uri,config){
    config = config||{};
    if (!config.aliasReg){
        return uri;
    }
    var dict = config.aliasDict||{};
    return uri.replace(config.aliasReg,function($1,$2){
        return dict[$2]||$1;
    });
};
/**
 * wrap uri with flag
 * @param  {String} type - path type, rs or cs or js
 * @param  {String} uri  - absolute uri
 * @return {String} uri after wrap
 */
exports.wrapURI = function(type,uri){
    return util.format('#<%s+%s>#',type||'',uri||'');
};
/**
 * unwrap uri flag
 * @param  {String}   content  - content with uri wrap
 * @param  {Function} callback - url handler
 * @return {String}   content after unwrap uri
 */
exports.unwrapURI = function(content,callback){
    callback = callback||function(type,uri){
        return uri;
    };
    return content.replace(/#<(.*?)\+(.*?)>#/gi,function($1,$2,$3){
        return callback($2.toLowerCase(),$3)||$3;
    });
};
/**
 * wrap nej module version placeholder
 * @param  {String} file - file path
 * @return {String} path after wrap
 */
exports.wrapVersion = function(file){
    return util.format("[#MODULE_VERSION#%s]",file);
};
/**
 * unwrap uri flag
 * @param  {String}   content  - content with uri wrap
 * @param  {Function} callback - url handler
 * @return {String}   content after unwrap uri
 */
exports.unwrapVersion = function(content,callback){
    callback = callback||function(uri){
        return '{}';
    };
    return content.replace(/\[#MODULE_VERSION#(.+?)\]/g,function($1,$2){
        return callback($2)||'{}';
    });
};
/**
 * auto generator unique key for file
 * @param  {String} file - absolute file path
 * @return {Number} key for file
 */
exports.uri2key = (function(){
    var seed = 1,
        cache = {};
    return function(file){
        // for auto id
        if (!file){
            return seed++;
        }
        var key = cache[file];
        if (!key){
            key = seed++;
            cache[file] = key;
        }
        return key;
    };
})();
