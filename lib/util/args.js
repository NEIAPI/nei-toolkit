/*
 * arguments from shell parse api
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */

'use strict';

let util = require('util');
let path = require('path');
let EventEmitter = require('events');
let _util = require('../util/util');
let _path = require('../util/path');
let _fs = require('../util/file');

class Args extends EventEmitter {
    /**
     * @param  {object} config - config object
     * @return {undefined}
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
     * @param  {array} args - arguments from command line
     * @return {undefined}
     */
    exec(args) {
        // parse arguments list
        let ret = this.parse(args);
        let opt = ret.options;
        let cmd = ret.command && ret.command.toLowerCase();
        // check `help` key
        if (opt.h || opt.help) {
            this.show(cmd);
            this.emit('exit', 0);
        }
        // check `version` key
        if (!cmd && (opt.v || opt.version)) {
            this.log(`Toolkit Version is ${this.package.version} \n`);
            this.emit('exit', 0);
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
            this.emit('exit', 0);
        }
    }

    /**
     * show message
     * @param  {string} [key] - message key
     * @return {undefined}
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
     * 格式化参数
     * @param {string} key  - 配置标识
     * @param {object} args - 参数数据信息
     * @return {object} config object
     */
    format(key, args) {
        // check message config
        let list = this.messages[key + '-params'];
        if (!list || !list.length) {
            return {};
        }
        // 先处理文件路径参数, 并计算参数为相对路径的值
        list.some((it) => {
            if (!it.p) return false; // 继承迭代
            let filePath = args[it.j] || args[it.q];
            if (!filePath) return true; // 终断迭代
            let absFilePath = _path.absolute(filePath, process.cwd() + '/');
            let absFileDir = `${path.dirname(absFilePath)}/`;
            let configJson = _util.file2json(absFilePath, true);
            Object.keys(configJson).forEach((key) => {
                let item = list.find((itt) => {
                    return itt.j === key || itt.q === key;
                });
                if (item) {
                    // 命令行中的参数的优先级要大于指定文件中的参数
                    if (!args.hasOwnProperty(key)) {
                        if (item.rp) {
                            // 相对于 absFilePath 的路径值
                            args[key] = _path.absolute(configJson[key], absFileDir);
                        } else {
                            args[key] = configJson[key];
                        }
                    }
                } else if (!args.hasOwnProperty(key)) {
                    // 命令行中的参数的优先级要大于指定文件中的参数
                    args[key] = configJson[key];
                }
            });
            // 终断迭代
            return true;
        });
        let template = args.template || args.t || 'webapp';
        let template2 = null;
        if (template === 'mobile') {
            template2 = `${template}-${args.l || args.lang}`;
        }
        list = list.filter((item) => {
            if (item && !util.isString(item)) {
                if (item.f) {
                    if (item.f === template || item.f === template2) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
            return false;
        });
        let jianXie = {};
        list.forEach(function (it) {
            if (it.j) {
                jianXie[it.j] = [
                    it.q,
                    it.d == null ? '' : it.d
                ];
            } else if (args[it.q] && typeof(it.d) === 'boolean') {
                // 如果默认值是布尔型的, 就把值转成布尔的, 只有当值为 'false' 时才认为是 false, 其他值都认作 true
                args[it.q] = args[it.q] !== 'false';
            } else {
                args[it.q] = it.d;
            }
        });
        Object.keys(jianXie).forEach((key) => {
            let it = jianXie[key];
            let name = it[0];
            if (args[name] == null) {
                args[name] = args[key] || it[1];
            }
            delete args[key];
        });
        args.templateData = {};
        Object.keys(args).forEach((arg) => {
            if (arg === 'templateData') return;
            let item = list.find((it) => it.q === arg);
            if (!item) {
                args.templateData[arg] = args[arg];
                delete args[arg];
            }
        });
        this.checkConfig(args);
        return args;
    }

    /**
     * 检查一些必须正确的参数，如果不正确，提早退出程序，方便错误排查
     * @param {object} config - 包含所有参数的对象
     * @return {undefined}
     */
    checkConfig(config) {
        let checkBuildConfig = () => {
            if (!/^(mobile)$/.test(config.template)) {
                return;
            }
            if (/^(oc|java)$/.test(config.lang)) {
                if (!config.templatePath) {
                    this.log("Error: please specify your project template's path");
                    this.emit('exit', 1);
                }
                if (!_fs.isdir(config.templatePath)) {
                    this.log("Error: project template's path not exist");
                    this.emit('exit', 1);
                }
            }
            if (/^(oc)$/.test(config.lang)) {
                if (!config.templateDataPath) {
                    this.log("Error: please specify your project template data file path");
                    this.emit('exit', 1);
                }
                if (!_fs.exist(config.templateDataPath)) {
                    this.log("Error: project template data file path not exist");
                    this.emit('exit', 1);
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
     * @param  {string} msg - log message
     * @return {undefined}
     */
    log(msg) {
        this.emit('log', msg);
    }

    /**
     * arguments parse,
     * build -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:[]}
     * build file.js -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:['file.js']}
     * @param  {array}  argv - arguments list
     * @return {object} result after parse, eg. {command:'abc',options:{a:true,b:'bbb'},args:['aaaa']}
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
     * @param {string} key - command name
     * @return {string}
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

}

module.exports = Args;

