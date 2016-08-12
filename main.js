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

class Main {
    /**
     * 构建 nei 工程
     * @param  {object}  cliArgs - cliArgs object
     */
    build(cliArgs) {
        this.cliArgs = cliArgs;
        this.config = {
            outputRoot: null, // 输出根目录
            ds: null // nei 上的数据源
        };
        this.loadData((ds) => {
            this.config.ds = ds;
            this.checkNEIConfig();
            new Builder(this.cliArgs, this.config);
        });
    }

    /**
     * update nei project
     * @param  {object}  cliArgs - cliArgs object
     * @return {undefined}
     */
    update(cliArgs) {
        let cwd = process.cwd() + '/';
        let project = _path.absolute(
            cliArgs.project + '/', cwd
        );
        let list = fs.readdirSync(project);
        if (!list || !list.length) {
            return _logger.error('no nei project found in %s', project);
        }
        _logger.error('check to update all nei project');
        // check nei cliArgs directory
        let reg = /^nei\.([\d]+)$/;
        list.forEach((name) => {
            if (_fs.isdir(project + name + '/') && reg.test(name)) {
                cliArgs.id = RegExp.$1;
                this.build(cliArgs);
            }
        });
    }

    /**
     * generate mock data
     * @param  {object}  cliArgs - cliArgs object
     * @return {undefined}
     */
    mock(cliArgs) {
        let cwd = process.cwd() + '/';
        cliArgs.outputRoot = _path.absolute(
            cliArgs.output + '/', cwd
        );
        this.loadData(cliArgs.id, (data) => {
            let builder = new Builder(cliArgs);
            builder.mock(data);
        });
    }

    /**
     * export mobile models and requests
     * @param  {object}  cliArgs - cliArgs object
     * @return {undefined}
     */
    mobile(cliArgs) {
        let cwd = process.cwd() + '/';
        cliArgs.outputRoot = _path.normalize(_path.absolute(
            cliArgs.output + '/', cwd
        ));
        let lang = cliArgs.lang;
        if (!/^(oc|java)$/.test(lang)) {
            return _logger.error(`not supported language "${lang}"`);
        }
        this.loadData(cliArgs.id, (data) => {
            let builder = new (require(`./lib/nei/mobile.${lang}.js`))(cliArgs);
            builder.model(data);
        });
    }

    /**
     * start mock server
     * @param  {object}  cliArgs - cliArgs object
     * @return {undefined}
     */
    server(cliArgs) {
        let tryStartServer = (cliArgsPath) => {
            if (_fs.exist(cliArgsPath)) {
                let options = Object.create(null);
                options.cliArgs = cliArgsPath;
                options.fromNei = true;
                // start server
                jtr(options);
            } else {
                _logger.warn(`can't find jtr cliArgs file at: ${cliArgsPath}`);
            }
        }
        if (cliArgs.cliArgsFile) {
            let cliArgsFilePath = _path.absolute(
                cliArgs.cliArgsFile, process.cwd() + '/'
            );
            return tryStartServer(cliArgsFilePath);
        }
        let dir = path.join(process.cwd(), cliArgs.path);
        if (_fs.exist(dir)) {
            if (cliArgs.id) {
                let jtrConfigPath = path.join(dir, `nei.${cliArgs.id}/jtr.js`);
                tryStartServer(jtrConfigPath);
            } else {
                // try to find jtr cliArgs file in `nei.{pid}` dir
                let list = fs.readdirSync(dir);
                let cliArgsFileFound = false;
                for (let i = 0, l = list.length; i < l; i++) {
                    let p = `${dir}/${list[i]}`;
                    if (_fs.isdir(p)) {
                        if (list[i].match(/nei/)) {
                            cliArgsFileFound = true;
                            tryStartServer(`${p}/jtr.js`);
                            break;
                        }
                    } else if (list[i] === 'jtr.js') {
                        cliArgsFileFound = true;
                        tryStartServer(p);
                        break;
                    }
                }
                if (!cliArgsFileFound) {
                    _logger.warn(`can't find jtr cliArgs file`)
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
        let projectKey = this.cliArgs.key;
        let specType = {
            web: 0
        }[this.cliArgs.specType];
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
    checkNEIConfig() {
        let cwd = process.cwd() + '/';
        let pid = this.config.ds.project.id;
        this.config.outputRoot = _path.normalize(_path.absolute(this.cliArgs.output + '/', cwd));
        let neiConfigFile = `${this.config.outputRoot}nei.${pid}/nei.json`;
        let action = this.cliArgs.action;
        let errorMsg = null;
        if (_fs.exist(neiConfigFile)) {
            if (action === 'build') {
                errorMsg = '项目 %s 已经存在, 请使用 "nei update" 命令更新项目';
            }
        } else {
            if (action === 'update') {
                errorMsg = '请先使用 "nei build" 命令构建项目 %s';
            }
        }
        if (errorMsg) {
            _logger.error(errorMsg, pid);
            return process.exit(1);
        }
    }
}

module.exports = new Main();


