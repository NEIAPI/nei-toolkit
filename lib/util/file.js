/*
 * file operate utility api
 * @module   util/file
 * @author   genify(caijf@corp.netease.com)
 */
var  fs    = require('fs'),
     path   = require('path'),
     util   = require('util'),
    _path   = require('./path.js');
/**
 * raw of file content
 * @param  {String} file - absolute file path
 * @return {Array}  raw content of file
 */
exports.raw = function(file){
    try{
        return fs.readFileSync(file.split(/[?#]/)[0]);
    }catch(ex){
        return null;
    }
};
/**
 * read file content
 * @param  {String} file    - absolute file path
 * @param  {String} charset - content charset,default is utf-8
 * @return {Array}  file content with line separate
 */
exports.read = function(file,charset){
    try{
        charset = (charset||'utf-8').toLowerCase();
        var content = '';
        if (charset==='utf-8'){
            content = fs.readFileSync(file,charset);
        }else{
            var buffer = fs.readFileSync(file);
            content = require('iconv-lite').decode(buffer,charset);
        }
        return content.split(/\r\n|\r|\n/);
    }catch(ex){
        console.error(ex.stack);
        return ex.stack.split(/\r\n|\r|\n/);
    }
};
/**
 * read file asynchronous
 * @param  {String}   file     - absolute file path
 * @param  {Function} callback - file read callback
 * @param  {String}   charset  - content charset,default is utf-8
 * @return {Void}
 */
exports.readAsync = function(file,callback,charset){
    charset = (charset||'utf-8').toLowerCase();
    var opt = {encoding:charset};
    if (charset!=='utf-8'){
        opt.encoding = null;
    }
    fs.readFile(file,opt,function(err,data){
        if (!!err){
            callback([
                util.format(
                    'cant read file %s for %s, cause:\n%j',
                    file,charset,err
                )
            ]);
            console.error(err);
            return;
        }
        // read success
        try{
            if (!opt.encoding){
                data = require('iconv-lite').decode(data,charset);
            }
            callback(data.split(/\r\n|\r|\n/));
        }catch(ex){
            callback([
                util.format(
                    'cant decode file %s for %s, cause:\n%s',
                    file,charset,ex.stack
                )
            ]);
            console.error(ex.stack);
        }
    });
};
/**
 * write content to file
 * @param  {String} file    - absolute file path
 * @param  {String} content - file content
 * @param  {String} charset - content charset, default is utf-8
 * @return {Void}
 */
var _writeFile = function(file,content,charset,callback){
    try{
        if (!file){
            return;
        }
        charset = (charset||'utf-8').toLowerCase();
        if (charset!=='utf-8'){
            content = require('iconv-lite').encode(content+'\r\n',charset);
        }
        callback.call(this,file,content);
    }catch(ex){
        throw util.format('cant write file [%s]%s for %s',charset,file,ex);
    }
};
/**
 * write content to file
 * @param  {String}  file    - absolute file path
 * @param  {String}  content - file content
 * @param  {String=} charset - content charset, default is utf-8
 * @return {Void}
 */
exports.write = function(file,content,charset){
    _writeFile(
        file,content,charset,
        function(file,content){
            fs.writeFileSync(file,content);
        }
    );
};
/**
 * write content to file asynchronous
 * @param  {String} file    - absolute file path
 * @param  {String} content - file content
 * @param  {String} charset - content charset, default is utf-8
 * @return {Void}
 */
exports.writeAsync = function(file,content,charset,callback){
    callback = callback||function(){};
    try{
        _writeFile(
            file,content,charset,
            function(file,content){
                fs.writeFile(file,content,function(err){
                    callback({
                        error:err,
                        file:file
                    });
                });
            }
        );
    }catch(ex){
        callback({
            error:ex,
            file:file
        });
    }
};
/**
 * copy file, will make dir first if src is not exist
 * @param  {String}   src    - original file
 * @param  {String}   dst    - target file
 * @param  {Function} logger - logger function
 */
exports.copy = function(src,dst,logger){
    this.mkdir(path.dirname(dst));
    fs.writeFileSync(dst,fs.readFileSync(src));
    if (!!logger){
        logger(src,dst);
    }
};
/**
 * remove file
 * @param  {String} file - file path
 * @return {Void}
 */
exports.rm = function(file){
    try{
        fs.unlinkSync(file);
    }catch(ex){
        // ignore
    }
};
/**
 * check directory for path
 * @param  {String}  dir - directory path
 * @return {Boolean} is directory
 */
exports.isdir = function(dir){
    try{
        return fs.lstatSync(dir).isDirectory();
    }catch(ex){
        return false;
    }
};
/**
 * create directory recursion
 * @param  {String} dir - directory path
 * @return {Void}
 */
exports.mkdir = function(dir){
    if (this.exist(dir)){
        return;
    }
    this.mkdir(path.dirname(dir));
    fs.mkdirSync(dir);
};
/**
 * remove directory, clear files first if not empty directory
 * @param  {String} dir - directory path
 * @return {Void}
 */
exports.rmdir = function(dir){
    if (!this.exist(dir)){
        return;
    }
    // remove file first
    var files = fs.readdirSync(dir);
    if (!!files&&files.length>0){
        files.forEach(function(v){
            var file = dir+v;
            if (!this.isdir(file)){
                this.rm(file);
            }else{
                this.rmdir(file+'/');
            }
        },this);
    }
    // remove dir
    fs.rmdirSync(dir);
};
/**
 * copy directory
 * @param  {String}   src    - original directory path
 * @param  {String}   dst    - target directory path
 * @param  {Function} logger - logger function
 * @return {Void}
 */
exports.cpdir = function(src,dst,logger){
    // copy file
    if (!this.isdir(src)){
        if (/\/$/.test(dst)){
            dst = dst+path.basename(src);
        }
        this.copy(src,dst,logger);
        return;
    }
    // copy dir
    var list = fs.readdirSync(src);
    if (!!list&&list.length>0){
        list.forEach(function(v){
            var it = src+v;
            if (this.isdir(it+'/')){
                this.cpdir(it+'/',dst+v+'/',logger);
            }else{
                this.copy(it,dst+v,logger);
            }
        },this);
    }
};
/**
 * list all files in directory
 * @param  {String}   dir    - direcotry path
 * @param  {Function} filter - file filter function, file will be dump if filter return true
 * @return {Array}    all files after filter
 */
exports.lsfile = (function(){
    var _isFileOK = function(file){
        return !0;
    };
    return function(dir,filter){
        var ret = [];
        // format dir
        if (!/\/$/.test(dir)){
            dir += '/';
        }
        // check dir
        if (!this.exist(dir)){
            return ret;
        }
        var list = fs.readdirSync(dir);
        // empty dir
        if (!list||!list.length){
            return ret;
        }
        // read dir recursive
        filter = filter||_isFileOK;
        list.forEach(function(name){
            // check filename or filepath
            var next = _path.normalize(dir+name);
            // dump next
            if (!this.isdir(next+'/')){
                if (filter(name,next)){
                    ret.push(next);
                }
            }else{
                ret.push.apply(
                    ret,this.lsfile(next+'/',filter)
                );
            }
        },this);
        return ret;
    };
})();
/**
 * check file exist
 * @param  {String}  file - absolute file path
 * @return {Boolean} file is exist
 */
exports.exist = function(file){
    file = (file||'').split(/[?#]/)[0];
    return (fs.existsSync||path.existsSync)(file);
};
