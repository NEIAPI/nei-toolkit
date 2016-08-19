/*
 * exports toolkit
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */
'use strict';

let fs = require('fs');
let util = require('util');
let path = require('path');
let _fs = require('./lib/util/file');
let _path = require('./lib/util/path');
let _util = require('./lib/util/util');
let _io = require('./lib/util/io');
let _log = require('./lib/util/logger');
let Builder = require('./lib/nei/builder');
let server = require('./lib/server/server');
let _logger = _log.logger;
let testData = require('./test/ds_a.json');

class Main {
    /**
     * 构建 nei 工程
     * @param  {object}  arg - 参数类的实例
     * @param  {string}  action - 操作命令
     * @param  {object}  args - 命令行参数对象
     */
    build(arg, action, args) {
        this.args = args;
        this.config = {
            action: action
        };
        let loadedHandler = (ds) => {
            let cwd = process.cwd() + '/';
            this.config.pid = ds.project.id;
            this.ds = ds;
            this.fillArgs();
            // 合并完参数后, 需要重新 format 一下, 并且此时需要取默认值
            this.args = arg.format(this.config.action, this.args, true);
            this.config.outputRoot = _path.normalize(_path.absolute(this.args.output + '/', cwd));
            this.config.neiConfigRoot = `${this.config.outputRoot}nei.${this.config.pid}/`;
            this.checkConfig();
            new Builder({
                config: this.config,
                args: this.args,
                ds: this.ds
            });
        }
        this.loadData(loadedHandler);
        //loadedHandler(testData.result);
    }

    /**
     * 更新 nei 工程规范
     * @param  {object}  arg - 参数类的实例
     * @param  {string}  action - 操作命令
     * @param  {object}  args - 命令行参数对象
     */
    update(arg, action, args) {
        let dir = path.join(process.cwd(), args.output);
        let tryReadConfig = (configFilePath) => {
            if (_fs.exist(configFilePath)) {
                let config = _util.file2json(configFilePath);
                args.key = config.args.key;
                args.specType = config.args.specType;
                this.build(arg, action, args);
            } else {
                _logger.warn(`文件不存在: ${configFilePath}`);
            }
        }
        this.findFile(dir, 'nei.json', (result) => {
            if (result === null) {
                return _logger.warn(`没找到构建工具的配置文件`);
            }
            tryReadConfig(result);
        });
    }

    /**
     * generate mock data
     * @param  {object}  args - args object
     */
    mock(args) {
        let cwd = process.cwd() + '/';
        args.outputRoot = _path.absolute(
            args.output + '/', cwd
        );
        this.loadData(args.id, (data) => {
            let builder = new Builder(args);
            builder.mock(data);
        });
    }

    /**
     * export mobile models and requests
     * @param  {object}  args - args object
     */
    mobile(args) {
        let cwd = process.cwd() + '/';
        args.outputRoot = _path.normalize(_path.absolute(
            args.output + '/', cwd
        ));
        let lang = args.lang;
        if (!/^(oc|java)$/.test(lang)) {
            return _logger.error(`not supported language "${lang}"`);
        }
        this.loadData(args.id, (data) => {
            let builder = new (require(`./lib/nei/mobile.${lang}.js`))(args);
            builder.model(data);
        });
    }

    /**
     * start mock server
     * @param  {object}  args - args object
     */
    server(args) {
        let tryStartServer = (configFilePath) => {
            if (_fs.exist(configFilePath)) {
                let options = {
                    configFilePath: configFilePath,
                    fromNei: true
                };
                server(options);
            } else {
                _logger.warn(`文件不存在: ${configFilePath}`);
            }
        }
        if (args.configFile) {
            let argsFilePath = _path.absolute(
                args.configFile, process.cwd() + '/'
            );
            return tryStartServer(argsFilePath);
        }
        let dir = path.join(process.cwd(), args.output);
        this.findFile(dir, 'server.config.js', (result) => {
            if (result === null) {
                return _logger.warn(`没找到服务配置文件`);
            }
            tryStartServer(result);
        });
    }

    /**
     * 从 NEI 服务器加载项目数据
     * @param {function} callback - 加载成功回调
     */
    loadData(callback) {
        let neiHost = 'http://localhost:9527/';
        let projectKey = this.args.key;
        let specType = {
            web: 0
        }[this.args.specType];
        let url = `${neiHost}/api/projectres/?key=${encodeURIComponent(projectKey)}&spectype=${specType}`;
        url = _path.normalize(url);
        _logger.info('从 NEI 服务器加载数据, 地址: %s', url);
        _io.download(url, (data) => {
            _logger.info(`数据加载完成, 开始解析数据`);
            let json;
            try {
                json = JSON.parse(data);
                if (json.code !== 200) {
                    _logger.error('NEI 服务器异常', json);
                    process.exit(1);
                }
            } catch (ex) {
                _logger.debug('NEI 数据 \n%s', data);
                _logger.error('NEI 数据解析错误: \n%s', ex.stack);
                process.exit(1);
            }
            callback(json.result);
        });
    }

    /**
     * 检测是否存在 nei 配置文件
     */
    checkConfig() {
        let neiConfigFile = `${this.config.neiConfigRoot}/nei.json`;
        let errorMsg = null;
        if (_fs.exist(neiConfigFile)) {
            if (this.config.action === 'build') {
                errorMsg = '项目 %s 已经存在, 请使用 "nei update" 命令更新项目';
            }
        } else {
            if (this.config.action === 'update') {
                errorMsg = '项目 %s 还未构建, 请先使用 "nei build" 命令构建项目';
            }
        }
        if (errorMsg) {
            _logger.error(errorMsg, this.config.pid);
            return process.exit(1);
        }
    }

    /**
     * 填充参数, 合并项目中的命令行参数设置、规范中的命令行参数
     */
    fillArgs() {
        let spec = this.ds.specs[0];
        let specArgsConfig = spec.spec.argsConfig;
        let proArgs = {};
        this.ds.cliargs.forEach(function (cliarg) {
            proArgs[cliarg.key] = cliarg.value;
        });
        let specCliArgDoc = null;
        let findSpecCliArg = (docs) => {
            specCliArgDoc = docs.find((doc) => {
                return doc.id === specArgsConfig;
            });
            if (!specCliArgDoc) {
                docs.forEach((doc) => {
                    findSpecCliArg(doc.children);
                });
            }
        }
        let specArgs = {};
        // 如果规范设置了命令行参数文件
        if (specArgsConfig) {
            findSpecCliArg(spec.docs);
            if (specCliArgDoc) {
                try {
                    specArgs = JSON.parse(specCliArgDoc.content);
                } catch (e) {
                    _logger.error(`规范设置的命令行参数文件, 它的内容不是有效的 json, 请检查是否有多余的逗号或者缺少逗号, 键及字符串类型的值是否都使用了英文双引号等: ${e}`);
                }
            }
        }
        this.args = Object.assign({}, specArgs, proArgs, this.args);
    }

    /**
     * 在指定目录下查找指定文件名的文件
     * @param {string} dir - 指定目录
     * @param {string} fileName - 指定文件名
     * @param {function} callback - 找到文件后的回调
     */
    findFile(dir, fileName, callback) {
        if (_fs.exist(dir)) {
            let list = fs.readdirSync(dir);
            let found = false;
            for (let i = 0, l = list.length; i < l; i++) {
                let p = `${dir}/${list[i]}`;
                if (_fs.isdir(p)) {
                    if (list[i].match(/nei/)) {
                        found = true;
                        callback(`${p}/${fileName}`);
                        break;
                    }
                } else if (list[i] === fileName) {
                    found = true;
                    callback(p);
                    break;
                }
            }
            if (!found) {
                callback(null);
            }
        } else {
            _logger.warn(`项目目录(${dir})不存在`);
        }
    }
}

module.exports = new Main();


