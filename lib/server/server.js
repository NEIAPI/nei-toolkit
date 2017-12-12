'use strict';
let fs = require('fs');
let path = require('path');
let nei = require('./nei');
let Server = require('./main');
let logger = require('../util/logger');

// 监听nei配置文件变化
function watchConfigForNei(configFilePaths, server, targetDir) {
  configFilePaths.forEach(function(p){
    console.log('watching'.yellow + ' '  + p.yellow)
  })
  configFilePaths.forEach(it => {
    try {
      fs.watchFile(it, function (event) {
        if (server) {
          console.log('配置文件变化：'.yellow + it.yellow);

          let routesAll = {};
          let temp = {};
          configFilePaths.forEach(e => {
            try {
              delete require.cache[require.resolve(e)];
              Object.assign(temp,require(e));
              Object.assign(routesAll, temp.routes);
            } catch (e) {
              logger.error(`找不到文件${e}`);
            }
          });
          temp.routes = routesAll;

          let options = wrapOptionsForNei(temp, targetDir);
          server.reset(options);
        }
      });
    } catch (err) {
      console.error('监听配置文件变化异常，请查看配置文件是否正确'.red);
    }

  })
}

// 包装nei配置文件
function wrapOptionsForNei(config, targetDir) {
  if (config.hasOwnProperty('changeOrigin') && !config.changeOrigin) { // 之前的配置没有changeOrigin,向下兼容
    config.changeOrigin = false;
  } else {
    config.changeOrigin = true;
  }

  let ua = config['user-agent'] === undefined ? 'pc' : config['user-agent'];
  if (!!config.modelServer && ua.toUpperCase() === 'MOBILE') {
    config.modelServer.headers['User-Agent'] = "Mozilla/5.0 (Linux; Android 4.4.4; HTC D820u Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.89 Mobile Safari/537.36"
  }

  nei.setting({
    projectKey: config.projectKey,
    online: config.online,
    reload: config.reload,
    view: path.resolve(targetDir, config.viewRoot) + '/',
    openUrl: config.openUrl,
    mockTpl: path.resolve(targetDir, config.mockTpl || '') + '/',
    mockApi: path.resolve(targetDir, config.mockApi || '') + '/',
    viewExt: config.viewExt || '.ftl',
    changeOrigin: config.changeOrigin,
    fmpp: config.fmpp || {},
    apiResHeaders: config.apiResHeaders || {},
    modelServer: config.modelServer,
    proxyModel: config['proxy-model'] === undefined ? false : config['proxy-model']
  });
  config.routes = nei.getRoutes(config.routes);

  return {
    port: config.port,
    rules: config.routes,
    online: config.online,
    reload: config.reload,
    watchingFiles: config.watchingFiles,
    dir: path.resolve(targetDir, config.webRoot) + '/',
    views: path.resolve(targetDir, config.viewRoot) + '/',
    openUrl: config.openUrl,
    launch: config.launch,
    engine: config.engine || 'freemarker',
    ext: config.viewExt || '.ftl',
    changeOrigin: config.changeOrigin,
    nei: true,
    https: config.https,
    proxyRoutes: config.proxyRoutes
  };
}

module.exports = function (config) {
  let options = config;
  let serverConfig,customConfigPath,sconfig,cconfig;
  if (options.fromNei) {
    // nei项目的接入
    serverConfig = options.configFilePath
    if ((typeof serverConfig === "string") && (serverConfig.constructor === String)) {
      sconfig = require(serverConfig);
    } else {
      sconfig = serverConfig;
    }
    if(config.args['config-path']){
      customConfigPath = path.join(sconfig.webRoot,config.args['config-path'].replace(/\'/g,''));
      cconfig = require(customConfigPath);
      Object.assign(sconfig,cconfig);
    }
    sconfig['proxy-model'] = config.args['proxy-model'];
    sconfig['user-agent'] = config.args['user-agent'];
    options = wrapOptionsForNei(sconfig, config.targetDir);
  }

  // server命令参数合并
  Object.assign(options, config.args);

  let server = new Server(options);
  server.start();

  let paths;
  if(config.watchConfigPaths){
    paths = config.watchConfigPaths;
  }else {
    paths = [serverConfig];
  }

  if(customConfigPath){
    paths.push(customConfigPath);
  }

  watchConfigForNei(paths, server, config.targetDir)
};