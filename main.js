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
let neiDbConst = require('./lib/fb-modules/config/db.json');
let _logger = _log.logger;
let Template = require('./lib/nei/template');

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
    let cwd = process.cwd() + '/';
    this.checkConfig();
    let loadedHandler = (ds) => {
      this.config.pid = ds.project && ds.project.id || ds.specs && ds.specs[0] && ds.specs[0]["spec"]["id"];
      this.ds = ds;
      this.fillArgs();
      // 合并完参数后, 需要重新 format 一下, 并且此时需要取默认值
      this.args = arg.format(this.config.action, this.args, true);
      // output 的参数有可能写在项目或者规范中, 这里重新计算, 然后还需要重新检查
      this.config.outputRoot = _path.normalize(_path.absolute((this.args.output || './') + '/', cwd));
      this.config.neiConfigRoot = `${this.config.outputRoot}nei.${this.config.pid}.${this.args.key || this.args.specKey}/`;
      this.checkConfig();
      new Builder({
        config: this.config,
        args: this.args,
        ds: this.ds
      });
    }
    this.loadData(loadedHandler);
  }

  /**
   *
   */
  template(arg, data) {
    if (!arg.path) {
      _logger.error(`未指定本地模板路径，请通过nei template -h 查看帮助`);
      return;
    }
    new Template(arg, data).build();
  }

  /**
   * 更新 nei 工程规范
   * @param  {object}  arg - 参数类的实例
   * @param  {string}  action - 操作命令
   * @param  {object}  args - 命令行参数对象
   */
  update(arg, action, args) {
    let dir = path.join(process.cwd(), args.output || './');
    let projects = this.findProjects(args);
    let buildProject = (neiProjectDir, exitIfNotExist) => {
      let config = _util.file2json(`${neiProjectDir}/nei.json`, exitIfNotExist, "未找到nei.json文件，请检查，建议使用nei build重新构建");
      let mergedArgs = Object.assign({}, config.args, args);
      if (mergedArgs.add) { // 只有update支持add,这里可能会有重复，由builder里去重
        mergedArgs.ids = mergedArgs.ids.concat(mergedArgs.add);
      }
      new Main().build(arg, action, mergedArgs);
    }
    if (args.key) {
      if (projects.length == 0) {
        _logger.error(`在 ${dir} 中找不到 key 为 ${args.key} 的项目, 请检查`);
        return process.exit(1);
      } else if (projects.length > 1) {
        _logger.error(`存在多个 key 为 ${args.key} 的项目, 请检查`);
        return process.exit(1);
      } else {
        buildProject(projects[0], true);
      }
    } else {
      if (projects.length > 1) {
        if (!args.all) {
          _logger.error(`存在多个 nei 项目, 请通过 key 参数指定需要更新的项目, 或者使用 --all 参数更新所有项目`);
          return process.exit(1);
        } else {
          projects.forEach(buildProject);
        }
      } else {
        buildProject(projects[0], true);
      }
    }
  }

  /**
   * start mock server
   * @param  {object}  args - args object
   */
  server(args) {
    let dir = path.join(process.cwd(), args.output || './');
    let tryStartServer = (configFilePath) => {
      if (_fs.exist(configFilePath)) {
        let options = {
          configFilePath: configFilePath,
          fromNei: true,
          targetDir: dir,
          args: args
        };
        args.project = projects[0];
        server(options);
      } else {
        _logger.warn(`文件不存在: ${configFilePath}`);
      }
    }
    let projects = this.findProjects(args);
    if (projects.length === 0) {
      if (args.key) {
        _logger.error(`在 ${dir} 中找不到 key 为 ${args.key} 的项目, 请检查`);
      } else {
        _logger.error(`在 ${dir} 中找不到 nei 项目, 请检查`);
      }
      return process.exit(1);
    } else if (projects.length > 1) {
      if (args.key) {
        _logger.error(`在 ${dir} 中找到多个 key 为 ${args.key} 的项目, 请检查`);
      } else if (args.all) {
        // 合并启动服务器
        let routes = {};
        let temp = {};
        projects.forEach(it => {
          try {
            temp = require(`${it}/server.config.js`);
            Object.assign(routes, temp.routes);
          } catch (e) {
            _logger.error(`找不到文件${it}/server.config.js`);
          }
        });
        temp.routes = routes;
        let options = {
          configFilePath: temp,
          fromNei: true,
          watchConfigPaths: projects.map(it => `${it}/server.config.js`),
          targetDir: dir,
          args: args
        };
        server(options);
      } else {
        _logger.error(`在 ${dir} 中找到多个 nei 项目, 请使用 key 参数指定要启动的项目, 或使用--all选项合并路由`);
        return process.exit(1);
      }
    } else {
      tryStartServer(`${projects[0]}/server.config.js`);
    }
  }

  /**
   * 从 NEI 服务器加载项目数据
   * @param {function} callback - 加载成功回调
   */
  loadData(callback) {
    // let neiHost = 'http://test.nei.hz.netease.com';
    let neiHost = 'https://nei.netease.com/';
    let url;
    if (this.args.hasOwnProperty('specKey')) {
      let specKey = this.args.specKey;
      url = `${neiHost}/api/specificationres/?key=${encodeURIComponent(specKey)}`;
    } else {
      let key = this.args.key;
      let specType = {
        web: neiDbConst.CMN_TYP_WEB,
        aos: neiDbConst.CMN_TYP_AOS,
        ios: neiDbConst.CMN_TYP_IOS,
        test: neiDbConst.CMN_TYP_TEST
      }[this.args.specType] || neiDbConst.CMN_TYP_WEB;

      url = `${neiHost}/api/projectres/?key=${encodeURIComponent(key)}&spectype=${specType}`;
    }
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
   * 检测指定的目录中是否存在 nei 配置文件
   */
  checkConfig() {
    let action = this.config.action;
    let outputDir = this.config.outputRoot;
    if (!_fs.exist(outputDir)) {
      // 目录不存在, update 命令不会走到这里
      return;
    }
    let result = {};
    _fs.walk(outputDir,
      filename => {
        if (path.basename(filename) === 'nei.json')
          result['file'] = true;
        return filename;
      },
      (dirname, r, level) => {
        if (level > 1) {
          return false;
        }
        let basename = path.basename(dirname);
        if (basename.startsWith('nei') && basename.endsWith(this.args.key || this.args.specKey)) {
          result['dir'] = basename;
        }
        return dirname;
      }, result, 0);
    let foundConfigFile = null;
    if (result['file'] && result['dir']) {
      foundConfigFile = result['dir'];
    }
    let errorMsg = null;
    if (foundConfigFile) {
      if (action === 'build') {
        errorMsg = '项目 %s 已存在, 请使用 nei update 命令更新项目';
      } else if (action === 'update') {
        _logger.debug('更新项目 %s', foundConfigFile);
      }
    } else {
      if (action === 'update') {
        errorMsg = '没找到通过 nei 构建的项目, 请先使用 nei build 命令构建项目';
      }
    }
    if (errorMsg) {
      _logger.error(errorMsg, foundConfigFile);
      return process.exit(1);
    }
  }

  /**
   * 填充参数, 合并项目中的命令行参数设置、规范中的命令行参数
   */
  fillArgs() {
    let spec = this.ds.specs[0];
    if (!spec) {
      _logger.error(`项目没找到工程规范, 请检查是否已经给项目指定了规范, 或者 specType 参数值是否正确`);
      return process.exit(1);
    }
    let specArgsConfig = spec.spec.argsConfig;
    let proArgs = {};
    this.ds.cliargs && this.ds.cliargs.forEach(function (cliarg) {
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
   * 查找指定输出目录下的 nei 项目
   */
  findProjects(args) {
    let dir = path.join(process.cwd(), args.output || './');
    if (!_fs.exist(dir)) {
      // 目录不存在, 退出程序
      _logger.error(`项目目录 ${dir} 不存在, 请检查`);
      return process.exit(1);
    }
    let files = fs.readdirSync(dir);
    let projects = [];
    files.forEach((file) => {
      if (args.key) {
        if (file.startsWith('nei') && file.endsWith(args.key)) {
          projects.push(`${dir}/${file}`);
        }
      } else if (file.startsWith('nei') && file.length >= 42) {
        // 疑是 nei 项目, 42 是 nei 配置文件的长度, 考虑到项目有可能会超过 5 位, 这里使用 >=
        projects.push(`${dir}/${file}`);
      }
    });
    return projects;
  }
}

module.exports = new Main();