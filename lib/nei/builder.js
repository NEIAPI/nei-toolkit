/*
 * NEI Builder
 * @author huntbao
 */
'use strict';
let vm = require('vm');
let util = require('util');
let querystring = require('querystring');
let Handlebars = require('handlebars');
let EventEmitter = require('events');
let Diff = require('./diff');
let _io = require('../util/io');
let _fs = require('../util/file');
let fs = require('fs');
let _path = require('../util/path');
let path = require('path');
let _util = require('../util/util');
let logger = require('../util/logger');
let mockDataWork = require('../fb-modules/util/mock_data_worker');
let neiDbConst = require('../fb-modules/config/db.json');
let dsUtil = require('./ds.util');
let NeiNoParse = require('./nei.no.parse');
let PbxProj = require('./mobile.oc.pbx.js');
require('./handlebars.util');

const DEFAULT_MOCK_FILTER = ['module.exports = function (json, req) {', '\treturn json;', '}'].join('\n');
const TEXT_REGEX = /^(text\/.+)|(application\/json)$/;

class Builder extends EventEmitter {
  /**
   * @param  {object} options - 参数
   * @property  {object} options.config - 一些构建工具需要使用的配置参数
   * @property  {object} options.args - 命令行参数
   * @property  {object} options.ds - nei 原始数据源
   */
  constructor(options) {
    super();
    this.options = options;
    this.config = options.config;
    this.args = options.args;
    this.spec = options.ds.specs[0];
    this.ds = dsUtil.format(options.ds);
    // 页面模板mock规则
    this.templateMockRules = [];
    // 渲染模板时传入的数据
    this.data = {
      args: this.args,
      config: {},
      project: this.ds.project,
      spec: this.ds.spec,
      interfaceMockRules: [],
      datatypeEnums: this.ds.datatypeEnums,
      ds: this.ds,
      _ds: options.ds
    };
    delete this.ds.project;
    delete this.ds.spec;
    delete this.ds.datatypeEnums;
    this.injectHandlebars(this.spec.docs);
    this.neiNoParse = this.getNoPassRule(this.spec.docs, this.options.config.outputRoot);
    // 先找配置文件
    this.findConfigs();
    // 将一些 config 信息设置到传给模板的数据中
    this.setConfigToData();
    // 是否更新普通文件
    this.shouldUpdateNormalDoc = this.canGenNormalDoc();
    // 先构建mock数据, 因为mock数据的信息需要传给Handlebars模板
    this.diffResult = null;
    if (this.args.key) {
      // diff
      this.diffResult = new Diff(this.config, this.options.ds);
      this.buildInterfaceMock();
      this.buildTemplateMock();
      this.buildViewRules();
    }
    this.buildDocsTree();
    if (this.args.key) {
      // 生成 nei 配置文件
      this.buildNeiConfig();
      // 生成 server 配置文件
      this.buildServerConfig();
      // 更新 ios 项目的工程文件
      if (this.isIosProject()) {
        this.updatePbxFile();
      }
    }

  }

  /**
   * 找配置文件
   */
  findConfigs() {
    let docs = this.spec.docs;
    let spec = this.spec.spec;
    let find = (docs, dir) => {
      docs.forEach((doc) => {
        if (doc.type === neiDbConst.SPC_NOD_DIR) {
          // 目录
          let filename = this.compileInVm(doc.name, this.data);
          let file = _path.normalize(`${dir}/${filename}/`);
          switch (doc.id) {
            case spec.webRoot:
              this.config.webRoot = file;
              break;
            case spec.viewRoot:
              this.config.viewRoot = file;
              break;
            case spec.mockApiRoot:
              this.config.mockApiRoot = file;
              break;
            case spec.mockViewRoot:
              this.config.mockViewRoot = file;
              break;
            case spec.jarRoot:
              this.config.jarRoot = file;
              break;
            default:
              break;
          }
          find(doc.children, file);
        }
      });
    }
    find(docs, this.config.outputRoot);
  }

  /**
   * 将一些 config 信息设置到传给模板的数据中
   */
  setConfigToData() {
    let config = this.config;
    Object.assign(this.data.config, {
      webRoot: config.webRoot && config.webRoot.replace(this.config.outputRoot, '/'),
      viewRoot: config.viewRoot && config.viewRoot.replace(this.config.outputRoot, '/'),
      mockApiRoot: config.mockApiRoot && config.mockApiRoot.replace(this.config.outputRoot, '/'),
      mockViewRoot: config.mockViewRoot && config.mockViewRoot.replace(this.config.outputRoot, '/')
    });
  }

  /**
   * 生成异步接口的mock数据
   */
  buildInterfaceMock() {
    // 工程结构中没有设置异步接口的mock数据根目录
    if (!this.config.mockApiRoot && this.args.iosAssemble) {
      logger.log("error", {message: "iosAssemble功能必须在工程规范上指定mock文件夹"});
      logger.log("error", {message: `nei ${this.config.action} 失败，正在退出`});
      process.exit("0");
    }
    if (!this.config.mockApiRoot) {
      return;
    }
    var docname;
    if (this.isIosProject() && this.args.iosAssemble) {
      let filter = function (docs, result) {
        function helper(doc, result) {
          if (doc.type == neiDbConst.SPC_NOD_FILE && doc.dataSource == neiDbConst.SPC_DTS_INTERFACE && doc.name.indexOf('interface.reqClassName') != -1) {
            result.push(doc)
          } else if (doc.type == neiDbConst.SPC_NOD_DIR) {
            filter(doc.children, result)
          }
        }

        docs.forEach(doc => {
          helper(doc, result)
        })
      };
      var result = [];
      filter(this.spec.docs, result);
      if (result.length > 0) {
        docname = result[0].name
        docname = path.basename(docname, path.extname(docname))
      }
    }
    let mockApiRoot = this.config.mockApiRoot;
    let getMockDataPath = (url, suffix) => {
      // windows 的文件夹名称不能有特殊字符, 将 url 中的 ": ? & =" 转成 "/_/"
      /**
       * 17.01.18
       * 由于iOS的文件依赖文件名来区别，路径没有影响，所以这里需要使用类名来作为文件名
       * @author {AbnerZheng}
       */
      //return _path.normalize(url.replace(/:|\?|&|=/g, '/_/') + '/data');
      return _path.normalize(url.replace(/:|\?|&|=/g, '/_/') + '/' + suffix);
    };
    this.options.ds.interfaces.forEach((itf) => {
      let method = itf.method.toLowerCase();
      let url = itf.path;
      let suffix;
      if (this.data.args.iosAssemble) {
        if (docname) {
          var data = Object.assign({}, this.data);
          data['interface'] = itf;
          data['interface']['reqClassName'] = dsUtil.getReqClassName(itf);
          suffix = this.compileInVm(docname, data)
        } else {
          suffix = dsUtil.getReqClassName(itf)
        }
      } else {
        suffix = 'data'
      }
      let name = getMockDataPath(url, suffix);
      let file = _path.normalize(`${mockApiRoot}/${method}/${name}`);
      let mockDataFile = `${file}.json`;
      let result = mockDataWork.getParameterMockData(this.data.ds.constraints, itf.resFormat, itf.params.outputs, this.options.ds.datatypes);
      if (result.error && result.error.length) {
        logger.log("error", {message: result.error.map(err => err.message).join(', ')});
      }
      // 检查 afterScript
      result = mockDataWork.getAfterScriptResult(this.data.ds.constraints, result.json, itf);
      if (result.error && result.error.length) {
        logger.log("error", {message: result.error.map(err => err.message).join(', ')});
      }
      this.output(mockDataFile, JSON.stringify(result.json, null, 4));
      // 输出 mock filter
      let mockFilterFile = `${file}.js`;
      if (!fs.existsSync(mockFilterFile)) {
        this.output(mockFilterFile, DEFAULT_MOCK_FILTER); // 17.02.08, 当已经修改了data.js文件时，就不在更新该数据
      }
      // 给接口代理工具准备的数据, 比如 fiddler
      let items = {
        id: itf.id,
        path: url,
        mockFile: file.replace(this.config.mockApiRoot, '').replace(/^(\/)*/, ''),
        method: method.toUpperCase(),
        group: itf.group.name
      };
      if (itf.params.outputs[0] && itf.params.outputs[0].type === neiDbConst.MDL_SYS_FILE) {
        items.isFile = true;
      }
      this.data.interfaceMockRules.push(items);
    });
  }

  /**
   * 生成页面模板的mock数据
   */
  buildTemplateMock() {
    // 工程结构中没有设置视图的mock数据根目录
    if (!this.config.mockViewRoot) {
      return;
    }
    this.options.ds.templates.forEach((it) => {
      let hit = this.ds.templates.find((tpl) => {
        return tpl.path === it.path || it.path + `.${this.data.spec.viewExt}` === tpl.path;
      });
      if (!hit) {
        // 模板没有被页面引用, 不用处理
        return;
      }
      let params = it.params;
      let filename = it.path.replace(/\.[^\/]*?$/, '');
      let file = _path.normalize(`${this.config.mockViewRoot}/${filename}`);
      let mockDataFile = `${file}.json`;
      let result = {};
      if (params && params.length) {
        result = mockDataWork.getParameterMockData(this.data.ds.constraints, neiDbConst.MDL_TYP_NORMAL, params, this.options.ds.datatypes)
      }
      if (result.error && result.error.length) {
        logger.log("error", {message: result.error.map(err => err.message).join(', ')});
      }
      let json = result.json || {};
      // 页面标题
      json.title = json.title || it.name;
      // 页面描述
      json.description = json.description || it.description;
      this.output(mockDataFile, JSON.stringify(json, null, 4));
      // 输出 mock filter
      let mockFilterFile = `${file}.js`;
      this.output(mockFilterFile, DEFAULT_MOCK_FILTER);
    });
  }

  /**
   * 生成视图路由规则
   */
  buildViewRules() {
    this.options.ds.pages && this.options.ds.pages.forEach((item) => {
      let tpls = item.templates;
      if (!item.path || !tpls || !tpls.length) {
        return;
      }
      let tplList = tpls.map((tpl) => {
        return {
          id: tpl.id,
          path: dsUtil.getFileNameByPath(tpl.path)
        }
      });
      this.templateMockRules.push({
        method: 'GET',
        path: item.path,
        list: JSON.stringify(tplList),
        name: item.name
      });
    });
  }

  compileInVm(content, data) {
    let newContext = Object.assign({}, this._vmContext);
    newContext['__data__'] = data;
    newContext['__content__'] = content;
    try {
      let script = vm.createScript(`Handlebars.compile(__content__)(__data__)`);
      return script.runInNewContext(newContext);
    } catch (e) {
      logger.log('error', {message: `生成文件错误: ${e}`});
    }
  }

  injectHandlebars(docs) {
    let importCustomHandleBarHelper = function (docs) {
      let helpersFunc = function (docs, result) {
        docs.forEach(doc => {
          if (doc.type === neiDbConst.SPC_NOD_FILE && doc.dataSource === neiDbConst.SPC_DTS_HANDLEBAR) {
            result.push(doc)
          } else if (doc.type !== neiDbConst.SPC_NOD_FILE) {
            helpersFunc(doc.children, result)
          }
        });
      }
      let helpers = [];
      helpersFunc(docs, helpers);
      let sandbox = {Handlebars, neiDbConst, console};
      let newVmContext = new vm.createContext(sandbox);
      helpers.forEach((helper) => {
        try {
          let script = new vm.createScript(helper.content);
          script.runInContext(newVmContext);//在vm中运行
        } catch (e) {
          logger.log('error', {message: `自定义文件${helper.name} 包含错误: ${e}`});
        }
      });
      return newVmContext;
    };
    this._vmContext = importCustomHandleBarHelper(docs); //导入用户定义的handlebar函数
  }


  /**
   * 生成工程规范文件
   */
  buildDocsTree() {
    let docs = this.spec.docs;
    let genFiles = (ds, itemName, doc, dir) => {
      ds.forEach((item) => {
        if (!item.name) {
          // 没有名称，说明是匿名类型，也就是 Object 类型
          return;
        }
        let data = Object.assign({}, this.data);
        data[itemName] = item;
        let filename = this.compileInVm(doc.name, data);
        if (filename.trim() === '') {
          return logger.log('debug', {
            message: `文件 ${doc.name} 的计算值为空字符串, 不生成`
          });
        }
        let file = _path.normalize(`${dir}/${filename}`);
        let content;

        content = this.compileInVm(doc.content || '', data);
        this.output(file, content);
      });
    };
    /**
     * 将datasource为5的加入到vm中，此处，对于这些文件并不下载，而是和后面其他文件统一下载
     * @param docs
     */

    let isIOSInterfaceDirRemoved = false;
    let isIOSDatatypeDirRemoved = false;
    let genDocs = (docs, dir) => {
      docs.forEach((doc) => {
        if (doc.type === neiDbConst.SPC_NOD_FILE) {
          // 先判断文件是否是非文本
          if (!TEXT_REGEX.test(doc.mime) && this.shouldUpdateNormalDoc) {
            let filename = this.compileInVm(doc.name, this.data);
            let file = _path.normalize(`${dir}/${filename}`);
            // 考虑到需要下载的文件体积有可能比较大, 它不受 overwrite 参数控制, 如果需要重新下载, 则用户需要先在本地将它删除
            if (_fs.exist(file)) {
              return logger.log('debug', {
                message: `文件已存在, 不下载: ${file}`
              });
            }
            // 如果事先不创建文件夹, 在下载文件的时候偶尔会报错
            try {
              logger.log('debug', {
                message: `创建文件夹: ${dir}`
              });
              _fs.mkdir(dir);
            } catch (e) {
              logger.log('error', {
                message: `创建文件夹异常: ${e}`
              });
            }
            return _io.downloadFile(doc.content, file);
          }
          // 文件
          switch (doc.dataSource) {
            case neiDbConst.SPC_DTS_HANDLEBAR:
              //Handlebars函数不生成
              break;
            case neiDbConst.SPC_DTS_NONE:
              let filename = this.compileInVm(doc.name, this.data);
              if (this.shouldUpdateNormalDoc || !_fs.exist(filename)) { // issue#46: 该文件被删除的时候，也应该生成
                // 普通文件, 没有数据源
                if (filename.trim() === '') {
                  logger.log('debug', {
                    message: `文件 ${doc.name} 的计算值为空字符串, 不生成`
                  });
                  break;
                }
                let file = _path.normalize(`${dir}/${filename}`);
                let content;
                if (this.neiNoParse && this.neiNoParse.dontParse(file)) {
                  content = doc.content;
                } else {
                  content = this.compileInVm(doc.content || '', this.data);
                }
                this.output(file, content);
              }
              break;
            case neiDbConst.SPC_DTS_INTERFACE:
              // 如果是iOS项目并且接口或者数据模型有变化, 则把已有的接口都先删除, 然后再创建这个目录
              if (this.isIosProject() && (this.diffResult.interfaceChanged || this.diffResult.datatypeChanged) && !isIOSInterfaceDirRemoved) {
                logger.log('debug', {
                  message: `删除接口文件夹: ${dir}/`
                });
                _fs.rmdir(`${dir}/`);
                _fs.mkdir(`${dir}/`);
                isIOSInterfaceDirRemoved = true;
              }
              // 以异步接口列表为数据源填充
              if (this.config.pbxUpdateDir === undefined) {
                this.config.pbxUpdateDir = [dir]
              } else if (this.config.pbxUpdateDir.findIndex(x => x === dir) === -1) {
                this.config.pbxUpdateDir.push(dir);
              }
              genFiles(this.ds.interfaces, 'interface', doc, dir);
              break;
            case neiDbConst.SPC_DTS_DATATYPE:
              // 如果是iOS项目并且接口或者数据模型有变化, 则把已有的数据模型都先删除, 然后再创建这个目录
              if (this.isIosProject() && (this.diffResult.interfaceChanged || this.diffResult.datatypeChanged) && !isIOSDatatypeDirRemoved) {
                logger.log('debug', {
                  message: `删除数据模型文件夹: ${dir}/`
                });
                _fs.rmdir(dir + '/');
                _fs.mkdir(dir + '/');
                isIOSDatatypeDirRemoved = true;
              }
              // 以数据模型列表为数据源填充
              if (this.config.pbxUpdateDir === undefined) {
                this.config.pbxUpdateDir = [dir];
              } else if (this.config.pbxUpdateDir.findIndex(x => x === dir) === -1) {
                this.config.pbxUpdateDir.push(dir);
              }
              if (doc.name && (doc.name.search('!!enum') != -1)) {
                doc.name = doc.name.replace(/!!enum/g, '');
                genFiles(this.data.datatypeEnums, 'datatype', doc, dir);
              } else {
                genFiles(this.ds.datatypes, 'datatype', doc, dir);
              }
              break;
            case neiDbConst.SPC_DTS_TEMPLATE:
              // 以页面模板列表为数据源填充
              genFiles(this.ds.templates, 'template', doc, dir);
              break;
            case neiDbConst.SPC_DTS_WEBVIEW:
              // 以页面列表为数据源填充
              genFiles(this.ds.pages, 'view', doc, dir);
              break;
            default:
              break;
          }
        } else {
          // 目录
          let filename = this.compileInVm(doc.name, this.data);
          let file = _path.normalize(`${dir}/${filename}`);
          _fs.mkdir(file);
          genDocs(doc.children, file);
        }
      });
    }

    var needDepAnalyse = true;
    // 2017.5.31: 加入tags、ids等功能, 本质上就是个过滤器以及依赖分析
    if (this.args.ids && this.args.ids.length > 0) {
      this.ds.interfaces = this.interfacesFilter(this.ds.interfaces, this.args.ids,
        (item, ks) => {
          if (item.id in ks) {
            ks[item.id] = true;
            return true;
          }
          return false;
        });
    } else if (this.args.tags && this.args.tags.length > 0) { // tags和ids不能级联使用
      this.ds.interfaces = this.interfacesFilter(this.ds.interfaces, this.args.tags, (item, ks) => {
        return item.tag.split(",").some(t => {
          if (t in ks) {
            ks[t] = true;
            return true;
          }
          return false;
        });
      })
    } else {
      needDepAnalyse = false;
    }
    if (needDepAnalyse) {
      let dataTypeSet = {};
      this.ds.interfaces.forEach(inte => {
        // 检查input
        let helper = function (d) {
          if (d.format == 0) {
            dataTypeSet[d.typeId] = true;
          }
        };
        inte.inputs.forEach(d => {
          helper(d);
        })
        inte.outputs.forEach(d => {
          helper(d);
        })
      });

      let dataTypesHashMap = {};
      this.ds.datatypes.forEach(dt => {
        dataTypesHashMap[dt.id] = dt;
      });

      let initDatatype = this.ds.datatypes.filter(d => {
        return d.id in dataTypeSet;
      });
      let memorization = {}; // memorization方法， 复杂度可以控制在O(n)
      let recursiveHelper = function (initDatatypes) {
        initDatatypes.forEach(d => {
          if (!d) return;
          if (d.id in memorization) { //已经生成过
            return;
          }
          memorization[d.id] = dataTypesHashMap[d.id]; // 设置为已生成过
          let nextDataTypes = d.fields.filter(dt => {
            return dt.format == neiDbConst.MDL_FMT_HASH; // 筛选出自定义类型
          }).map(dt => {
            return dataTypesHashMap[dt.typeId];
          });
          recursiveHelper(nextDataTypes);
        });
      };

      recursiveHelper(initDatatype);
      this.ds.datatypes = Object.keys(memorization).map(key => {
        return memorization[key];
      });
    }
    genDocs(docs, this.config.outputRoot);
  }

  interfacesFilter(interfaces, filterKeys, filterFunc) {
    var keyset = {};
    filterKeys.forEach(key => {
      keyset[key] = false; // 去除重复key, 这里保证不会有重复
    });
    interfaces = interfaces.filter(item => { // 将需要的接口筛选出来
      return filterFunc(item, keyset);

    });
    let keysNotFound = Object.keys(keyset).filter(id => {
      return !keyset[id];
    });
    if (keysNotFound.length > 0) {
      logger.log("error", {message: `以下筛选条件未找到:${keysNotFound},请到nei网站上仔细核实`});
      process.exit(-1);
    }
    return interfaces;
  }

  /**
   * 生成 nei 配置文件
   */
  buildNeiConfig() {
    if (/^(build|update)$/.test(this.config.action)) {
      let file = `${this.config.neiConfigRoot}nei.json`;
      let args = {
        specType: this.args.specType,
        pid: this.config.pid
      };
      ["key", "specKey", "iosProjectPath", "iosProjectPath", "tags", "ids"].forEach((key) => {
        if (this.args[key]) {
          args[key] = this.args[key];
        }
      });
      this.output(file, JSON.stringify({
        args
      }, null, 4), true);
    }
  }

  /**
   * 生成 nei server 配置文件
   */
  buildServerConfig() {
    let jtrConfigTpl = _fs.read(`${__dirname}/template/server.config.js.tpl`).join('\n');
    let rules = this.templateMockRules.concat(this.data.interfaceMockRules);
    // 按 rules 的 path 字段进行排序, 参数多的排前面, 使得优先匹配
    rules.sort((rule1, rule2) => {
      return rule1.path > rule2.path ? -1 : 1;
    });
    let neiServerConfigFilePath = `${this.config.neiConfigRoot}server.config.js`;
    let neiServerConfig = {
      launch: true,
      port: 8002,
      online: false,
      onlineServer: "https://nei.netease.com",
      https: false,
      reload: true,
      openUrl: '',
      apiResHeaders: null,
      watchingFiles: {
        compilers: {
          mcss: false
        },
        ignored: ''
      },
      modelServer: null
    };
    if (this.config.action === 'update') {
      // 更新的时候，launch、port、online、https、apiResHeaders参数需要保留，因为这些参数非常可能是用户仍旧希望保留的
      let existNeiServerConfig = _util.file2json(neiServerConfigFilePath, true, `请检查文件:${neiServerConfigFilePath}，确保它是一个可执行文件`);
      Object.keys(neiServerConfig).forEach((property) => {
        if (existNeiServerConfig.hasOwnProperty(property)) {
          neiServerConfig[property] = existNeiServerConfig[property];
        }
      });
      // 17.06.02 routes需要merge, 如果路由已经改为http开头的,则不再更新该项
      let routeNeedMerge = {};
      Object.keys(existNeiServerConfig.routes).forEach((k) => {
        let value = existNeiServerConfig.routes[k];
        if (util.isString(value)) {
          routeNeedMerge[k.trim()] = value;
        } else if (value.list) {//如果是模板
          var hasModified = value.list.some(l => {
            return l.path.startsWith("http");
          })
          if (hasModified) {
            routeNeedMerge[k.trim()] = value;
          }
        } else if (value.path && value.path.startsWith("http")) {//如果是页面
          routeNeedMerge[k.trim()] = value;
        }
      });
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i];
        let k = (rule.method + " " + rule.path);
        if (k in routeNeedMerge) {
          let existRule = routeNeedMerge[k];
          if (util.isString(existRule)) {
            rule.value = existRule;
          } else if (existRule.list) {
            rule.name = existRule.name;
            rule.list = JSON.stringify(existRule.list);
          } else {
            rule.mockFile = existRule.path;
            rule.id = existRule.id;
            rule.group = existRule.group;
          }
          delete routeNeedMerge[k];
        }
      }
      Object.keys(routeNeedMerge).forEach(k => {
        let existRule = routeNeedMerge[k];
        let m = k.split(/\s+/);
        var rule = {
          method: m[0],
          path: m[1]
        };
        if (util.isString(existRule)) {
          rule.value = existRule;
        } else if (existRule.list) {
          rule.name = existRule.name;
          rule.list = JSON.stringify(existRule.list);
        } else {
          rule.mockFile = existRule.path;
          rule.id = existRule.id;
          rule.group = existRule.group;
        }
        rules.push(rule);
      })
    }
    // jar 包存放目录以及暴露给模板的实例名和类名的映射关系
    if (this.config.jarRoot || this.spec.jarConfig.length > 0) {
      let jarConfig = {}
      this.spec.jarConfig.forEach((cfg) => {
        jarConfig[cfg.instanceName] = cfg.klassName;
      })
      neiServerConfig.fmpp = {
        jarDir: this.config.jarRoot,
        jarConfig: jarConfig
      }
    }
    let data = Object.assign({}, this.config, {
      engine: this.data.spec.engine,
      viewExt: this.data.spec.viewExt || "ftl",
      rules: rules,
      projectKey: this.args.key
    }, neiServerConfig);
    if (data.modelServer && data.modelServer.path) {
      if (typeof data.modelServer.path === 'function') {
        data.modelServer.path = data.modelServer.path.toString();
      }
    }
    let content = Handlebars.compile(jtrConfigTpl)(data);
    this.output(neiServerConfigFilePath, content, true);
  }

  /**
   * // 更新 ios 项目的工程文件
   */
  updatePbxFile() {
    let productName = null;
    let condition1 = this.config.action === "build"; //build时要更新
    let condition2 = this.config.action === "update" && (this.diffResult.datatypeChanged || this.diffResult.interfaceChanged); //数据有更新
    let condition3 = this.isIosProject();// 一定是ios工程
    let condition4 = this.config.action === "update" && this.options.args.pbxForce; // 如果更新时，指定强制更新，也应该更新
    if (condition3 && (condition1 || condition2 || condition4)) {
      // 更新pbxproj文件(xcode 工程)
      let iosProjectPath = this.args.iosProjectPath || this.config.outputRoot;
      iosProjectPath = _path.absolutePath(iosProjectPath, this.config.outputRoot);
      let fileList = fs.readdirSync(iosProjectPath);
      fileList.find((filename) => {
        if (filename.endsWith('.xcodeproj')) {
          productName = filename.split('.')[0];
          return true;
        }
      });

      if (!productName) {
        return logger.log('info', {
          message: `Can't find .xcodeproj file to update`
        });
      }
      let projectPath = _path.normalize(iosProjectPath + productName);
      let projectFilePath = _path.normalize(projectPath + '.xcodeproj/project.pbxproj');
      // check if pbxproj file exists
      if (_fs.exist(projectFilePath)) {
        let pbxProj = new PbxProj(productName, projectPath, projectFilePath);
        if (this.args.iosAssemble) {
          this.config.pbxUpdateDir.push(this.config.mockApiRoot);
        }
        pbxProj.update(this.config.pbxUpdateDir);
      } else {
        logger.log('info', {
          message: `无pbx文件，无需更新`
        });
      }
    } else {
      logger.log('info', {
        message: `接口和数据类型未更新,不需更新工程`
      });
    }
  }

  /**
   * 在使用 nei update 命令更新项目时, 是否可以更新普通文件和文件夹
   */
  canGenNormalDoc() {
    return this.config.action === 'build' || (this.config.action === 'update') && this.args.spec;
  }

  /**
   * 是否是 iOS 项目
   */
  isIosProject() {
    return this.options.args.specType === 'ios';
  }

  /**
   * 同步写文件
   * @param  {string} file - 文件完整路径, 包括文件名
   * @param  {string} content - 文件内容
   * @param  {boolean} [ignoreCheck] - 是否忽略检查文件是否已经存在
   */
  output(file, content, ignoreCheck) {
    let overWrite = this.args.overwrite;
    let option = file.match(/!!([wW]|n[wW])/g);
    if (option && option.length) {
      option = option[0].toLowerCase();
      file = file.replace(/!!(w|nw)/g, '');
      if (option == '!!w') {
        overWrite = true;
      } else if (option === '!!nw') {
        overWrite = false;
      }
    }
    if (!ignoreCheck && _fs.exist(file) && !overWrite) {
      return logger.log('debug', {
        message: `文件已存在, 不覆盖: ${file}`
      });
    }
    _io.outputSync(file, content);
    if (path.extname(file) === '.sh') { //17.2.8, 需要修改运行权限
      fs.chmodSync(file, '777')
    }
    logger.log('debug', {
      data: [file],
      message: '输出: %s'
    });
  }

  getNoPassRule(docs, root) {
    let ruleFile = docs.filter((doc) => {
      return doc.name === '.neinoparse';
    });
    if (ruleFile.length === 0) {
      return null;
    }
    if (ruleFile.length > 1) {
      logger.log('debug', {
        message: "更目录下存在大于一份.neinoparse文件"
      });
    }
    return new NeiNoParse(ruleFile[0].content, root);
  }
}

module.exports = Builder;

