/*
 * exports toolkit
 * @author  genify(caijf@corp.netease.com)
 * @author  huntbao
 */
'use strict';

let fs = require('fs');
let util = require('util');
let path = require('path');
var jtr = require('jtr');
let _fs = require('./lib/util/file');
let _path = require('./lib/util/path');
let _io = require('./lib/util/io');
let _log = require('./lib/util/logger');
let _util = require('./lib/util/util');
let Builder = require('./lib/nei/builder');
let _logger = _log.logger;
let testData = require('./test/ds_a.json');

class Main {
    /**
     * 构建 nei 工程
     * @param  {string}  action - 操作命令
     * @param  {object}  args - args object
     */
    build(action, args) {
        this.action = action;
        this.args = args;
        this.config = {};
        let loadedHandler = (ds) => {
            let cwd = process.cwd() + '/';
            this.ds = ds;
            this.config.outputRoot = _path.normalize(_path.absolute(this.args.output + '/', cwd));
            this.checkConfig();
            this.fillArgs();
            new Builder({
                config: this.config,
                args: this.args,
                ds: this.ds
            });
        }
        //this.loadData(loadedHandler);
        loadedHandler(testData.result);
    }

    /**
     * update nei project
     * @param  {object}  args - args object
     */
    update(args) {
        let cwd = process.cwd() + '/';
        let project = _path.absolute(
            args.project + '/', cwd
        );
        let list = fs.readdirSync(project);
        if (!list || !list.length) {
            return _logger.error('no nei project found in %s', project);
        }
        _logger.error('check to update all nei project');
        // check nei args directory
        let reg = /^nei\.([\d]+)$/;
        list.forEach((name) => {
            if (_fs.isdir(project + name + '/') && reg.test(name)) {
                args.id = RegExp.$1;
                this.build(args);
            }
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
        let tryStartServer = (argsPath) => {
            if (_fs.exist(argsPath)) {
                let options = Object.create(null);
                options.args = argsPath;
                options.fromNei = true;
                // start server
                jtr(options);
            } else {
                _logger.warn(`can't find jtr args file at: ${argsPath}`);
            }
        }
        if (args.argsFile) {
            let argsFilePath = _path.absolute(
                args.argsFile, process.cwd() + '/'
            );
            return tryStartServer(argsFilePath);
        }
        let dir = path.join(process.cwd(), args.path);
        if (_fs.exist(dir)) {
            if (args.id) {
                let jtrConfigPath = path.join(dir, `nei.${args.id}/jtr.js`);
                tryStartServer(jtrConfigPath);
            } else {
                // try to find jtr args file in `nei.{pid}` dir
                let list = fs.readdirSync(dir);
                let argsFileFound = false;
                for (let i = 0, l = list.length; i < l; i++) {
                    let p = `${dir}/${list[i]}`;
                    if (_fs.isdir(p)) {
                        if (list[i].match(/nei/)) {
                            argsFileFound = true;
                            tryStartServer(`${p}/jtr.js`);
                            break;
                        }
                    } else if (list[i] === 'jtr.js') {
                        argsFileFound = true;
                        tryStartServer(p);
                        break;
                    }
                }
                if (!argsFileFound) {
                    _logger.warn(`can't find jtr args file`)
                }
            }
        } else {
            _logger.warn(`project directory(${dir}) does not exist`)
        }
    }

    /**
     * 从 NEI 服务器加载项目数据
     * @param {function} callback - 加载成功回调
     */
    loadData(callback) {
        let neiHost = _util.getLocalConfig().neihost;
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
        let pid = this.ds.project.id;
        let neiConfigFile = `${this.config.outputRoot}nei.${pid}/nei.json`;
        let errorMsg = null;
        if (_fs.exist(neiConfigFile)) {
            if (this.action === 'build') {
                errorMsg = '项目 %s 已经存在, 请使用 "nei update" 命令更新项目';
            }
        } else {
            if (this.action === 'update') {
                errorMsg = '请先使用 "nei build" 命令构建项目 %s';
            }
        }
        if (errorMsg) {
            _logger.error(errorMsg, pid);
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
        (spec.cliargs || []).forEach(function (cliarg) {
            proArgs[cliarg[key]] = cliarg[value];
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
                    _logger.error(`规范设置的命令行参数文件, 它的内容不是有效的 json: ${e}`);
                }
            }
        }
        this.args = Object.assign({}, specArgs, proArgs, this.args);
    }
}

module.exports = new Main();


