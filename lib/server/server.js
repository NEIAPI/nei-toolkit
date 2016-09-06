var fs = require('fs');
var path = require('path');
var nei = require('./nei');
var _ = require('./util');
var Server = require('./main');

var cwd = process.cwd();

var canChange = true; // 是否触发重置服务操作

// 重置canChange标志变量
function resetCanChange() {
    setTimeout(function () {
        canChange = true;
    }, 1000);
}

// 监听nei配置文件变化
function watchConfigForNei(configFilePath, server) {
    try {
        console.log('开始监听配置文件：' + configFilePath);

        fs.watch(configFilePath, function (event) {
            if (event === 'change' && server && canChange) {
                console.log('配置文件变化：' + configFilePath);
                canChange = false;
                resetCanChange();

                var config = require(configFilePath);
                delete require.cache[require.resolve(configFilePath)];

                var options = wrapOptionsForNei(config);
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
        api: config.neiApi || '',
        view: config.viewRoot,
        mockTpl: config.mockTpl || '',
        mockApi: config.mockApi || '',
        viewExt: config.viewExt || '.ftl'
    });
    config.routes = nei.getRoutes(config.routes);

    return {
        port: config.port,
        rules: config.routes,
        dir: config.webRoot,
        views: config.viewRoot,
        launch: config.launch,
        engine: config.engine || 'freemarker',
        ext: config.viewExt || '.ftl',
        nei: true
    };
}

module.exports = function (config) {
    var options = config;
    var configFilePath;
    if (options.fromNei) {
        // nei项目的接入
        configFilePath = options.configFilePath;
        options = wrapOptionsForNei(require(configFilePath));
    }
    var server = new Server(options);
    server.start();
    if (configFilePath) {
        watchConfigForNei(configFilePath, server);
    }
};
