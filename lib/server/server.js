'use strict';
let fs = require('fs');
let path = require('path');
let nei = require('./nei');
let Server = require('./main');

// 监听nei配置文件变化
function watchConfigForNei(configFilePath, server) {
  try {
    console.log('开始监听配置文件：' + configFilePath);
    fs.watchFile(configFilePath, function (event) {
      if (server) {
        console.log('配置文件变化：' + configFilePath);
        delete require.cache[require.resolve(configFilePath)];
        let config = require(configFilePath);
        let options = wrapOptionsForNei(config);
        server.reset(options);
      }
    });
  } catch (err) {
    console.error('监听配置文件变化异常，请查看配置文件是否正确');
  }
}

// 包装nei配置文件
function wrapOptionsForNei(config) {
  nei.setting({
    projectKey: config.projectKey,
    online: config.online,
    reload: config.reload,
    view: config.viewRoot,
    openUrl: config.openUrl,
    mockTpl: config.mockTpl || '',
    mockApi: config.mockApi || '',
    viewExt: config.viewExt || '.ftl',
    fmpp: config.fmpp || {},
    apiResHeaders: config.apiResHeaders || {}
  });
  config.routes = nei.getRoutes(config.routes);

  return {
    port: config.port,
    rules: config.routes,
    online: config.online,
    reload: config.reload,
    dir: config.webRoot,
    views: config.viewRoot,
    openUrl: config.openUrl,
    launch: config.launch,
    engine: config.engine || 'freemarker',
    ext: config.viewExt || '.ftl',
    nei: true,
    https: config.https
  };
}

module.exports = function (config) {
  let options = config;
  let configFilePath;
  if (options.fromNei) {
    // nei项目的接入
    configFilePath = options.configFilePath;
    options = wrapOptionsForNei(require(configFilePath));
  }
  let server = new Server(options);
  server.start();
  if (configFilePath) {
    watchConfigForNei(configFilePath, server);
  }
};
