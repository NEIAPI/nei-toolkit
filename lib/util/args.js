/*
 * arguments from shell parse api
 * @module   exec/args
 * @author   genify(caijf@corp.netease.com)
 */
var util = require('util');
var path = require('path');
var _util = require('../util/util.js');
var _path = require('../util/path.js');
var _fs = require('../util/file.js');
// arguments parser
// package  - package information
// message  - message config, eg. {'-default':['default message'],'help':['message line1','message line2']}
var Arguments = module.exports = require('./klass.js').create();
var pro = Arguments.extend(require('./event.js'));

/**
 * class initialization
 * @param  {Object} config - config parameters
 * @return {Void}
 */
pro.init = function (config) {
    this._super(config);
    this._package = config.package || {};
    this._messages = config.message || {};
};
/**
 * show message
 * @param  {String} key - message key
 * @return {Void}
 */
pro.show = function (key) {
    var msg = this._messages[key];
    if (!msg) {
        key = '-default';
        msg = this._messages[key] || '';
    }
    if (util.isArray(msg)) {
        msg = msg.join('\n');
    }
    msg = msg.replace(
        '%v', this._package.version
    ).replace(
        '%p', this._params(key)
    );
    this._log(msg);
};
/**
 * exec for arguments list
 * @param  {Array} args - arguments
 * @return {Void}
 */
pro.exec = function (args) {
    // parse arguments list
    var ret = this._parse(args);
    var opt = ret.options;
    //console.log('%j',ret);
    // check help show
    if (opt.h || opt.help) {
        this.show(ret.command);
        this.emit('msg');
        return;
    }
    // check version
    var cmd = (ret.command || '').toLowerCase();
    if (!cmd && (opt.v || opt.version)) {
        this._log('Toolkit Version is %s \n', this._package.version);
        this.emit('msg');
        return;
    }
    // emit command event
    var event = {
        args: ret.args,
        options: ret.options
    };
    if (!!cmd) {
        this.emit(cmd, event);
    }
    // check command hit
    if (!event.stopped) {
        this.show();
        this.emit('msg');
    }
};
/**
 * 格式化数据简写规则
 * @param {String} key  - 配置标识
 * @param {Object} data - 数据信息
 * @return {Undefined}
 */
pro.format = function (key, data) {
    // check message config
    var list = this._messages[key + '-params'];
    if (!list || !list.length) {
        return;
    }
    // deal `path` parameter and compute `relative path`
    list.forEach((it) => {
        if (it.p) {
            var filePath = data[it.j] || data[it.q];
            if (filePath) {
                var absFilePath = _path.absolute(
                    filePath, process.cwd() + '/'
                );
                var absFileDir = `${path.dirname(absFilePath)}/`;
                var json = _util.file2json(absFilePath, true);
                Object.keys(json).forEach((key) => {
                    var item = list.find((itt) => {
                        return itt.j === key || itt.q === key;
                    });
                    if (item && !data.hasOwnProperty(key)) {
                        if (item.rp) {
                            // relative path of absFilePath
                            data[key] = _path.absolute(
                                json[key], absFileDir
                            );
                        } else {
                            data[key] = json[key];
                        }
                    }
                });
            }
        }
    });
    // map brief name
    var ret = {};
    list.forEach(function (it) {
        if (it.j) {
            ret[it.j] = [
                it.q,
                it.d == null ? '' : it.d
            ];
        } else if (data[it.q] == null && !!it.d) {
            data[it.q] = it.d;
        }
    });
    // complete
    Object.keys(ret).forEach(function (key) {
        var it = ret[key];
        var name = it[0];
        if (data[name] == null) {
            data[name] = data[key] || it[1];
        }
        delete data[key];
    });
    this._checkConfig(data);
};

/**
 * 检查一些必须正确的参数，如果不正确，提早退出程序，方便错误排查
 * @param {Object} config - 包含所有参数的对象
 * @return {Void}
 */
pro._checkConfig = function (config) {
    var checkBuildConfig = () => {
        if (!/^(mobile)$/.test(config.template)) {
            return;
        }
        if (/^(oc|java)$/.test(config.lang)) {
            if (!config.templatePath) {
                this._log("Error: please specify your project template's path");
                process.exit(1);
            }
            if (!_fs.isdir(config.templatePath)) {
                this._log("Error: project template's path not exist");
                process.exit(1);
            }
        }
        if (/^(oc)$/.test(config.lang)) {
            if (!config.templateDataPath) {
                this._log("Error: please specify your project template data file path");
                process.exit(1);
            }
            if (!_fs.exist(config.templateDataPath)) {
                this._log("Error: project template data file path not exist");
                process.exit(1);
            }
        }
    };
    switch (config.action) {
        case 'build':
            checkBuildConfig();
            break;
        default :
            break;
    }
};
/**
 * show log information
 * @private
 * @param  {String} msg - log message
 * @return {Void}
 */
pro._log = function (msg) {
    console.log.apply(console, arguments);
};
/**
 * arguments parse,
 * build -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:[]}
 * build file.js -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:['file.js']}
 * @param  {Array}  argv - arguments list
 * @return {Object} result after parse,eg. {command:'abc',options:{a:true,b:'bbb'},args:['aaaa']}
 */
pro._parse = function (argv) {
    var result = {options: {}, args: []};
    // clear space before/after "=" in aguments
    if (util.isArray(argv)) {
        argv = argv.join(' ');
    }
    var list = argv.split(/[\s]+/);
    // parse arguments line
    var key;
    list.forEach(function (it) {
        // not start with -
        if (it.indexOf('-') !== 0) {
            // for command
            if (!result.command) {
                result.command = it;
                return;
            }
            // for args
            if (!key) {
                result.args.push(it);
                return;
            }
            // for value
            result.options[key] = it;
            key = null;
            return;
        }
        // for start with -
        it = it.replace(/^[-]+/, '');
        if (!!key) {
            result.options[key] = !0;
        }
        key = it;
    });
    if (!!key) {
        result.options[key] = !0;
    }
    return result;
};
/**
 * 参数配置信息
 * @param key
 * @private
 */
pro._params = function (key) {
    // param list
    var list = this._messages[key + '-params'];
    if (!list || !list.length) {
        return '';
    }
    // generator param list
    var ret = [];
    list.forEach(function (it) {
        // support string item
        if (util.isString(it)) {
            ret.push(it);
            return;
        }
        // support {j:'xxx',q:'xxxxx',m:'xxxxxx'}
        var msg = '';
        if (!!it.j) {
            msg += '-' + it.j;
        }
        if (!!it.q) {
            if (!!it.j) {
                msg += ', ';
            }
            msg += '--' + it.q;
        }
        if (!!it.m) {
            msg += '\t\t' + it.m;
        }
        if (!!msg) {
            ret.push(msg);
        }
    });
    return ret.join('\n');
};

/**
 * 获取需要序列化的参数
 * @param {Object} config - 配置参数对象
 * @return {Object} 过滤后的对象
 */
pro.filterConfig = function (config) {
    var params = this._messages[`${config.action}-params`];
    var result = {};
    var setValue = (paramName) => {
        if (!/^(help|config)$/.test(paramName)) {
            result[paramName] = config[paramName];
        }
    };
    params.forEach((param) => {
        if (!config.hasOwnProperty(param.q)) return;
        if (param.f) {
            var ns = param.f.split();
            if (config.template.startsWith(ns[0])) {
                if (ns[1]) {
                    if (config.lang.startsWith(ns[1])) {
                        setValue(param.q);
                    }
                } else {
                    setValue(param.q);
                }
            }
        } else {
            setValue(param.q);
        }
    });
    return result;
};
