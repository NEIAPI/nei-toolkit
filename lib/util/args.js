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
     * @return {object} args object
     */
    format(key, args) {
        // check message config
        let list = this.messages[key + '-params'];
        if (!list || !list.length) {
            return {};
        }
        let removeJianxie = (config) => {
            Object.keys(config).forEach((c) => {
                let item = list.find(it => {
                    return it.j === c;
                });
                if (item) {
                    config[item.q] = config[c];
                    delete config[c];
                }
            });
        }
        let getDefaultValue = (config) => {
            list.forEach(item => {
                if (!config.hasOwnProperty(item.q)) {
                    config[item.q] = item.d;
                }
                // 如果默认值是布尔型的, 就把值转成布尔的
                // 只有当值为 'false' 时才认为是 false, 其他值都认作 true
                if (util.isBoolean(item.d) && !util.isBoolean(config[item.q])) {
                    config[item.q] = config[item.q] !== 'false'
                }
            });
        }
        // 将简写转成全写
        removeJianxie(args);
        // 获取默认参数
        getDefaultValue(args);
        return args;
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

