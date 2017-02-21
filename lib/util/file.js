/*
 * file operate utility api
 * @module   util/file
 * @author   genify(caijf@corp.netease.com)
 */
var fs = require('fs');
var path = require('path');
var util = require('util');
var _path = require('./path.js');
/**
 * raw of file content
 * @param  {string} file - absolute file path
 * @return {array}  raw content of file
 */
exports.raw = function (file) {
    try {
        return fs.readFileSync(file.split(/[?#]/)[0]);
    } catch (ex) {
        return null;
    }
};
/**
 * read file content
 * @param  {string} file    - absolute file path
 * @param  {string} [charset] - content charset,default is utf-8
 * @return {array}  file content with line separate
 */
exports.read = function (file, charset) {
    try {
        charset = (charset || 'utf-8').toLowerCase();
        var content = '';
        if (charset === 'utf-8') {
            content = fs.readFileSync(file, charset);
        } else {
            var buffer = fs.readFileSync(file);
            content = require('iconv-lite').decode(buffer, charset);
        }
        return content.split(/\r\n|\r|\n/);
    } catch (ex) {
        return ex.stack.split(/\r\n|\r|\n/);
    }
};
/**
 * read file asynchronous
 * @param  {string}   file     - absolute file path
 * @param  {function} callback - file read callback
 * @param  {string}   charset  - content charset,default is utf-8
 * @return {undefined}
 */
exports.readAsync = function (file, callback, charset) {
    charset = (charset || 'utf-8').toLowerCase();
    var opt = {encoding: charset};
    if (charset !== 'utf-8') {
        opt.encoding = null;
    }
    fs.readFile(file, opt, function (err, data) {
        if (!!err) {
            console.error(err);
            callback([
                util.format(
                    "can't read file %s for %s, cause:\n%j",
                    file, charset, err
                )
            ]);
            return;
        }
        // read success
        try {
            if (!opt.encoding) {
                data = require('iconv-lite').decode(data, charset);
            }
            callback(data.split(/\r\n|\r|\n/));
        } catch (ex) {
            console.error(ex.stack);
            callback([
                util.format(
                    "can't decode file %s for %s, cause:\n%s",
                    file, charset, ex.stack
                )
            ]);
        }
    });
};
/**
 * write content to file
 * @param  {string} file    - absolute file path
 * @param  {string} content - file content
 * @param  {string} charset - content charset, default is utf-8
 * @return {undefined}
 */
var _writeFile = function (file, content, charset, callback) {
    try {
        if (!file) {
            return;
        }
        charset = (charset || 'utf-8').toLowerCase();
        if (charset !== 'utf-8') {
            content = require('iconv-lite').encode(content + '\r\n', charset);
        }
        callback.call(this, file, content);
    } catch (ex) {
        throw util.format('cant write file [%s]%s for %s', charset, file, ex);
    }
};
/**
 * write content to file
 * @param  {string}  file    - absolute file path
 * @param  {string}  content - file content
 * @param  {String=} charset - content charset, default is utf-8
 * @return {undefined}
 */
exports.write = function (file, content, charset) {
    _writeFile(
        file, content, charset,
        function (file, content) {
            fs.writeFileSync(file, content);
        }
    );
};
/**
 * write content to file asynchronous
 * @param  {string} file    - absolute file path
 * @param  {string} content - file content
 * @param  {string} charset - content charset, default is utf-8
 * @return {undefined}
 */
exports.writeAsync = function (file, content, charset, callback) {
    callback = callback || function () {
        };
    try {
        _writeFile(
            file, content, charset,
            function (file, content) {
                fs.writeFile(file, content, function (err) {
                    callback({
                        error: err,
                        file: file
                    });
                });
            }
        );
    } catch (ex) {
        callback({
            error: ex,
            file: file
        });
    }
};
/**
 * check file permission
 * @param  {string} filePath - file path
 * @return {object} - permission object
 */
exports.permission = function (filePath) {
    var mode = fs.statSync(filePath).mode;
    var owner = mode >> 6;
    var group = (mode << 3) >> 6;
    var others = (mode << 6) >> 6;
    return {
        read: {
            owner: !!(owner & 4),
            group: !!(group & 4),
            others: !!(others & 4)
        },
        write: {
            owner: !!(owner & 2),
            group: !!(group & 2),
            others: !!(others & 2)
        },
        execute: {
            owner: !!(owner & 1),
            group: !!(group & 1),
            others: !!(others & 1)
        }
    };
};

/**
 * add execute permission on file
 * @param  {string} filePath - file path
 * @return {undefined}
 */
exports.addExecPermission = function (filePath) {
    fs.chmodSync(filePath, '755');
}
/**
 * copy file, will make dir first if src is not exist
 * @param  {string}   src    - original file
 * @param  {string}   dst    - target file
 * @param  {function} [logger] - logger function
 */
exports.copy = function (src, dst, logger) {
    this.mkdir(path.dirname(dst));
    fs.writeFileSync(dst, fs.readFileSync(src));
    // add execute permission if original file has execute permission
    if (this.permission(src).execute.owner) {
        this.addExecPermission(dst);
    }
    if (logger) {
        logger(src, dst);
    }
};
/**
 * remove file
 * @param  {string} file - file path
 * @return {undefined}
 */
exports.rm = function (file) {
    try {
        fs.unlinkSync(file);
    } catch (ex) {
        // ignore
    }
};
/**
 * check directory for path
 * @param  {string}  dir - directory path
 * @return {boolean} is directory
 */
exports.isdir = function (dir) {
    try {
        return fs.lstatSync(dir).isDirectory();
    } catch (ex) {
        return false;
    }
};
/**
 * create directory recursion
 * @param  {string} dir - directory path
 * @return {undefined}
 */
exports.mkdir = function (dir) {
    if (this.exist(dir)) {
        return;
    }
    this.mkdir(path.dirname(dir));
    fs.mkdirSync(dir);
};
/**
 * remove directory, clear files first if not empty directory
 * @param  {string} dir - directory path
 * @return {undefined}
 */
exports.rmdir = function (dir) {
    if (!this.exist(dir)) {
        return;
    }
    // remove file first
    var files = fs.readdirSync(dir);
    if (!!files && files.length > 0) {
        files.forEach(function (v) {
            var file = dir + v;
            if (!this.isdir(file)) {
                this.rm(file);
            } else {
                this.rmdir(file + '/');
            }
        }, this);
    }
    // remove dir
    fs.rmdirSync(dir);
};
/**
 * copy directory
 * @param  {string}   src    - original directory path
 * @param  {string}   dst    - target directory path
 * @param  {function} logger - logger function
 * @return {undefined}
 */
exports.cpdir = function (src, dst, logger) {
    // copy file
    if (!this.isdir(src)) {
        if (/\/$/.test(dst)) {
            dst = dst + path.basename(src);
        }
        this.copy(src, dst, logger);
        return;
    }
    // copy dir
    var list = fs.readdirSync(src);
    if (!!list && list.length > 0) {
        list.forEach(function (v) {
            var it = src + v;
            if (this.isdir(it + '/')) {
                // create dir first, because it may be empty dir
                this.mkdir(dst + v + '/');
                this.cpdir(it + '/', dst + v + '/', logger);
            } else {
                this.copy(it, dst + v, logger);
            }
        }, this);
    }
};
/**
 * list all files in directory
 * @param  {string}   dir - direcotry path
 * @param  {function} [filter] - file filter function, file will be dump if filter return true
 * @return {array}    all files after filter
 */
exports.lsfile = (dir, filter) => {
    var _isFileOK = function () {
        return !0;
    };
    var ret = [];
    // format dir
    if (!/\/$/.test(dir)) {
        dir += '/';
    }
    // check dir
    if (!this.exist(dir)) {
        return ret;
    }
    var list = fs.readdirSync(dir);
    // empty dir
    if (!list || !list.length) {
        return ret;
    }
    // read dir recursive
    filter = filter || _isFileOK;
    list.forEach(function (name) {
        // check filename or filepath
        var next = _path.normalize(dir + name);
        // dump next
        if (!this.isdir(next + '/')) {
            if (filter(name, next)) {
                ret.push(next);
            }
        } else {
            ret.push.apply(
                ret, this.lsfile(next + '/', filter)
            );
        }
    }, this);
    return ret;
};
/**
 * check file exist
 * @param  {string}  file - absolute file path
 * @return {boolean} file is exist
 */
exports.exist = function (file) {
    file = (file || '').split(/[?#]/)[0];
    return (fs.existsSync || path.existsSync)(file);
};
/**
 * rename file
 * @param  {string}  oldPath - file's old path
 * @param  {string}  newPath - file's new path
 * @return {undefined}
 */
exports.rename = function (oldPath, newPath) {
    fs.renameSync(oldPath, newPath);
};
/**
 * walk directory
 * @param  {string} dir - directory to be walked
 * @param  {function}[fileHandler]  - it will be called when walking on file
 * @param  {function}[dirHandler]  - it will be called when walking on directory
 * @return {undefined}
 */
exports.walk = (dir, fileHandler, dirHandler, result, level) => {
    var _handler = function (path) {
        return path;
    };
    // format dir
    if (!/\/$/.test(dir)) {
        dir += '/';
    }
    // check dir
    if (!this.exist(dir)) {
        return;
    }
    var list = fs.readdirSync(dir);
    // empty dir
    if (!list || !list.length) {
        return;
    }
    // read dir recursive
    fileHandler = fileHandler || _handler;
    dirHandler = dirHandler || _handler;
    list.forEach((name) => {
        var next = _path.normalize(dir + name);
        if (this.isdir(next + '/')) {
            // file name can be renamed in `dirHandler`
            next = dirHandler(next, result, level);
            if(next !== false){
              this.walk(next + '/', fileHandler, dirHandler,result, level + 1);
            }
        } else {
            fileHandler(next, result);
        }
    });
};
