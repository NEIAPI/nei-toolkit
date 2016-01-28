/*
 * arguments from shell parse api
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */

'use strict';

let util = require('util');
let path = require('path');
let EventEmitter = require('events');
let _util = require('../util/util.js');
let _path = require('../util/path.js');
let _fs = require('../util/file.js');

class Args extends EventEmitter {
    /**
     * @param  {Object} config - config object
     * @return {Undefined}
     */
    constructor(config) {
        super();
        this.cmds = {};
        Object.keys(config).forEach((key)=> {
            if (_util.isFunction(config[key])) {
                this.cmds[key] = true;
                this.on(key, config[key]);
            }
        });
        this.package = config.package;
        this.messages = config.message;
    }

    /**
     * @param  {Array} args - arguments from shell command
     * @return {Undefined}
     */
    exec(args) {
        // parse arguments list
        let ret = this.parse(args);
        let opt = ret.options;
        let cmd = ret.command.toLowerCase();
        // check `help` key
        if (opt.h || opt.help) {
            this.show(cmd);
            this.emit('exit');
        }
        // check `version` key
        if (!cmd && (opt.v || opt.version)) {
            this.log(`Toolkit Version is ${this.package.version} \n`);
            this.emit('exit');
        }
        // emit command event
        let event = {
            args: ret.args,
            options: ret.options
        };
        // check if cmd exist
        if (this.cmds[cmd]) {
            this.emit(cmd, event);
        } else {
            this.show();
            this.emit('exit');
        }
    }

    /**
     * show message
     * @param  {String} [key] - message key
     * @return {Undefined}
     */
    show(key) {
        let msg = this.messages[key];
        if (!msg) {
            key = '-default';
            msg = this.messages[key] || '';
        }
        if (Array.isArray(msg)) {
            msg = msg.join('\n');
        }
        msg = msg.replace(
            '%v', this.package.version
        ).replace(
            '%p', this.params(key)
        );
        this.log(msg);
    }

    /**
     * 格式化数据简写规则
     * @param {String} key  - 配置标识
     * @param {Object} data - 数据信息
     * @return {Undefined}
     */
    format(key, data) {
        // check message config
        let list = this.messages[key + '-params'];
        if (!list || !list.length) {
            return;
        }
        // deal `path` parameter and compute `relative path`
        list.forEach((it) => {
            if (!it.p) return;
            let filePath = data[it.j] || data[it.q];
            if (!filePath) return;
            let absFilePath = _path.absolute(
                filePath, process.cwd() + '/'
            );
            let absFileDir = `${path.dirname(absFilePath)}/`;
            let json = _util.file2json(absFilePath, true);
            Object.keys(json).forEach((key) => {
                let item = list.find((itt) => {
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
        });
        // map brief name
        let ret = {};
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
            let it = ret[key];
            let name = it[0];
            if (data[name] == null) {
                data[name] = data[key] || it[1];
            }
            delete data[key];
        });
        this.checkConfig(data);
    }

    /**
     * 检查一些必须正确的参数，如果不正确，提早退出程序，方便错误排查
     * @param {Object} config - 包含所有参数的对象
     * @return {Undefined}
     */
    checkConfig(config) {
        let checkBuildConfig = () => {
            if (!/^(mobile)$/.test(config.template)) {
                return;
            }
            if (/^(oc|java)$/.test(config.lang)) {
                if (!config.templatePath) {
                    this.log("Error: please specify your project template's path");
                    process.exit(1);
                }
                if (!_fs.isdir(config.templatePath)) {
                    this.log("Error: project template's path not exist");
                    process.exit(1);
                }
            }
            if (/^(oc)$/.test(config.lang)) {
                if (!config.templateDataPath) {
                    this.log("Error: please specify your project template data file path");
                    process.exit(1);
                }
                if (!_fs.exist(config.templateDataPath)) {
                    this.log("Error: project template data file path not exist");
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
    }

    /**
     * show log information
     * @param  {String} msg - log message
     * @return {Undefined}
     */
    log(msg) {
        console.log(msg);
    }

    /**
     * arguments parse,
     * build -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:[]}
     * build file.js -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:['file.js']}
     * @param  {Array}  argv - arguments list
     * @return {Object} result after parse, eg. {command:'abc',options:{a:true,b:'bbb'},args:['aaaa']}
     */
    parse(argv) {
        let result = {
            options: {},
            args: []
        };
        // clear space before/after keys
        if (Array.isArray(argv)) {
            argv = argv.join(' ');
        }
        let list = argv.split(/[\s]+/);
        // parse arguments line
        let key;
        list.forEach(function (it) {
            // not start with -
            if (!it.startsWith('-')) {
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
            if (key) {
                result.options[key] = true;
            }
            key = it;
        });
        if (key) {
            result.options[key] = true;
        }
        return result;
    }

    /**
     * 参数配置信息
     * @param {String} key
     * @return {Object}
     */
    params(key) {
        // param list
        let list = this.messages[key + '-params'];
        if (!list || !list.length) {
            return '';
        }
        // generator param list
        let ret = [];
        list.forEach(function (it) {
            // support string item
            if (util.isString(it)) {
                ret.push(it);
                return;
            }
            // support {j:'xxx',q:'xxxxx',m:'xxxxxx'}
            let msg = '';
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
    }

    /**
     * 获取需要序列化的参数
     * @param {Object} config - 配置参数对象
     * @return {Object} 过滤后的对象
     */
    filterConfig(config) {
        let params = this.messages[`${config.action}-params`];
        let result = {};
        let setValue = (paramName) => {
            if (!/^(help|config)$/.test(paramName)) {
                result[paramName] = config[paramName];
            }
        };
        params.forEach((param) => {
            if (!config.hasOwnProperty(param.q)) return;
            if (param.f) {
                let ns = param.f.split();
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
    }

}

module.exports = Args;

