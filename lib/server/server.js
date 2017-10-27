'use strict';
let fs = require('fs');
let path = require('path');
let nei = require('./nei');
let Server = require('./main');
let logger = require('../util/logger');

// 监听nei配置文件变化
function watchConfigForNei(configFilePaths, server, targetDir) {
  console.log('开始监听配置文件：' + configFilePaths);
  configFilePaths.forEach(it => {
    try {
      fs.watchFile(it, function (event) {
        if (server) {
          console.log('配置文件变化：' + it);

          let routesAll = {};
          let temp = {};
          configFilePaths.forEach(e => {
            try {
              delete require.cache[require.resolve(e)];
              temp = require(e);
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
      console.error('监听配置文件变化异常，请查看配置文件是否正确');
    }

  })
}

// 包装nei配置文件
function wrapOptionsForNei(config, targetDir) {
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
    modelServer: config.modelServer
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
    https: config.https
  };
}

module.exports = function (config) {
  let options = config;
  let serverConfig;
  if (options.fromNei) {
    // nei项目的接入
    serverConfig = options.configFilePath;
    if ((typeof serverConfig === "string") && (serverConfig.constructor === String)) {
      options = wrapOptionsForNei(require(serverConfig), config.targetDir);
    } else {
      options = wrapOptionsForNei(serverConfig, config.targetDir);
    }
  }
  let server = new Server(options);
  server.start();
  if (config.watchConfigPaths) {
    watchConfigForNei(config.watchConfigPaths, server, config.targetDir);
  } else {
    watchConfigForNei([serverConfig], server, config.targetDir)
  }
};
