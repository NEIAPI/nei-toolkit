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
        let getConfigFileData = () => {
            let json = {};
            let configArg = list.find(item => item.p);
            if (!configArg)  return json;
            let configFilePath = args[configArg.j] || args[configArg.q];
            if (!configFilePath) return json;
            let absFilePath = _path.absolute(configFilePath, process.cwd() + '/');
            let absFileDir = `${path.dirname(absFilePath)}/`;
            json = _util.file2json(absFilePath, true);
            return {
                json: json,
                dir: absFileDir
            };
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
        let filterList = (config) => {
            let forType1;
            let forType2;
            if (key === 'build') {
                forType1 = config.template || 'webapp';
                if (forType1 === 'mobile') {
                    forType2 = `${forType1}-${config.lang}`;
                }
            } else if (key === 'mobile') {
                forType1 = config.lang || 'oc';
            } else {
                return;
            }
            list = list.filter((item) => {
                if (item && !util.isString(item)) {
                    if (item.f) {
                        if (item.f === forType1 || item.f === forType2) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
                return false;
            });
        }
        let convertPath = (config, dir) => {
            if (!dir) return;
            list.filter(item => item.rp).forEach((item) => {
                let name = item.q;
                if (config.hasOwnProperty(name)) {
                    config[name] = _path.absolute(config[name], dir);
                }
            });
        }
        let getDefaultValue = (config) => {
            list.forEach(item => {
                if (!config.hasOwnProperty(item.q)) {
                    config[item.q] = item.d;
                    // 如果默认值是布尔型的, 就把值转成布尔的
                    // 只有当值为 'false' 时才认为是 false, 其他值都认作 true
                    if (util.isBoolean(item.d) && !util.isBoolean(config[item.q])) {
                        config[item.q] = config[item.q] !== 'false'
                    }
                }
            });
        }
        let extractTemplateData = (config) => {
            let sym = Symbol('saved_params');
            config[sym] = {
                templateData: {},
                configFileData: configFileData,
                args: args
            };
            Object.keys(config).forEach((c) => {
                let item = list.find((it) => it.q === c);
                if (!item) {
                    config[sym]['templateData'][c] = config[c];
                    delete config[c];
                }
            });
            // 获取方式
            // config[Object.getOwnPropertySymbols(config)[0]]
        }
        let configFileData = getConfigFileData();
        // 命令行中的参数, 优先级大于 config 指定的文件中的数据参数
        let config = Object.assign({}, configFileData.json, args);
        // 将简写转成全写
        removeJianxie(config);
        // 过滤不是当前 build 类型的参数
        filterList(config);
        // 将路径参数转为相对于 config 指定的文件路径
        convertPath(config, configFileData.dir);
        // 获取默认参数
        getDefaultValue(config);
        // 分离参数和模板数据
        extractTemplateData(config);
        this.checkConfig(config, key);
        return config;
    }

    /**
     * 检查一些必须正确的参数，如果不正确，提早退出程序，方便错误排查
     * @param {object} config - 包含所有参数的对象
     * @param {string} action - nei 命令
     * @return {undefined}
     */
    checkConfig(config, action) {
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
                if (config.productName === true || !config.productName) {
                    this.log(`Error: please specify the value of "productName"`);
                    this.emit('exit', 1);
                }
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
        switch (action) {
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

