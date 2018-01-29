'use strict';
let express = require('express');
let velocity = require('express-velocity');
let ejs = require('ejs');
let path = require('path');
let http = require('http');

let cors = require('cors')
let rewrite = require('./middleware/rewrite');
let routeBoard = require('./middleware/routeBoard');
let folder = require('./middleware/folder');
let livereload = require('./middleware/livereload');
let injector = require('./middleware/injector.js');
let freemarker = require('../node-fmpp');
let nei = require('./nei');
let Table = require('cli-table');
let colors = require('colors');
let util = require('../util/util');

let _ = require('./util');

function Server(options) {
  this.options = options || {};
  this.connection = [];

  this.init();
}

Server.prototype = {
  /**
   * 初始化服务
   */
  init: function () {
    let options = this.options;

    // 构建服务器
    /**
     * 当设置 fallthrough 为true的时候,当static file 找不到的时候,才会执行next()
     */
    let app = this.app = express({
      fallthrough: !!options.online
    });
    app.use(cors());

    // 默认配置参数
    _.extend(options, {
      views: 'views',
      engine: {},
      port: 8000,
      https: false, // 默认关闭https
      app: app,
      injector: [],
      reload: true,
      launch: true,
      'proxy-model': true,
      'proxy-routes': true,
      'user-agent': 'pc'
    });

    let server;
    if (options.https) {
      let https = require('https');
      let fs = require('fs');
      let serverOptions = {
        key: fs.readFileSync(require.resolve('./cert/server.key')),
        cert: fs.readFileSync(require.resolve('./cert/server.crt'))
      };
      server = this.server = https.createServer(serverOptions, app);
    } else {
      server = this.server = http.createServer(app);
    }

    if (typeof options.rules === 'string') {
      // 补全路由路径
      options.rules = path.resolve(options.rules);
    }

    // 设置视图路径
    app.set('views', options.views);

    // 设置模板引擎
    let engine = _.isObject(options.engine) || {};
    engine.vm = velocity({
      root: [options.views]
    });
    engine.ftl = freemarker();
    engine.ejs = ejs.renderFile;
    if (options.nei && typeof options.engine === 'string') {
      // 针对nei,允许修改后缀和渲染引擎的对应关系
      let renderMap = {
        freemarker: freemarker(),
        ejs: ejs.renderFile,
        velocity: velocity({
          root: [options.views]
        })
      };
      let ext = options.ext;
      ext = ext.indexOf('.') === 0 ? ext.substr(1) : ext;

      if (renderMap[options.engine]) engine[ext] = renderMap[options.engine];
    }
    for (let i in engine) {
      if (engine.hasOwnProperty(i)) app.engine(i, engine[i]);
    }

    app.use(injector(options));

    // 监听模板和静态文件的变化
    if (options.reload) {
      options.server = server;
      app.use(livereload(options))
    }

    // 用户自定义配置的代理路由,注意此处触发的位置
    if (options['proxy-routes']) {
      app.use(rewrite({
        rules: options.proxyRoutes,
        dir: options.dir,
        changeOrigin: options.changeOrigin
      }));
    }

    // 重写路由,生成路由代理
    if (options.rules) {
      app.use(rewrite(options));
    }
    // 跨域处理
    app.options("/*", function (req, res, next) {
      let headers = nei.getting().API_RES_HEADERS;
      Object.keys(headers).forEach(function (h) {
        res.header(h, headers[h]);
      });
      res.sendStatus(200);
    });

    // 处理访问根路径的情况,针对nei项目
    if (options.rules && options.nei) app.use(routeBoard(options));

    // 处理访问文件夹的情况
    app.use(folder(options));

    // 设置服务器根目录
    // 静态资源根目录不是必需的, 可以是直接 Mock 接口的需求
    if (options.dir) {
      app.use(express.static(options.dir));
    }

    if (options.online) {
      let newRount = nei.getRoutes({
        "ALL *": {}
      });
      app.use(rewrite({
        rules: newRount
      }));
    }

    // 异常控制
    app.use(function (err, req, res, next) {
      console.error(err.message || err);
      res.status(500).send('某些东东跪了ORZ……');
    });

    server.on('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        // 接口已被使用,尝试接口加一
        console.log(colors.yellow('端口' + options.port + '已被占用,尝试新端口' + (++options.port)));
        setTimeout(() => {
          this.start();
        }, 1000);
      } else {
        console.error(err.stack);
      }
    }.bind(this));

    server.on('listening', function () {
      let lh = 'localhost',
        url;
      if (this.options['dev-domain'] && this.options.mode > 1) {
        lh = this.options['dev-domain'];
      }
      url = `${options.https ? 'https' : 'http'}://${lh}:` + options.port;
      if (options.openUrl) {
        if (options.openUrl.startsWith('http')) {
          url = options.openUrl;
        } else {
          url = `${url}/${options.openUrl}`;
        }
      }

      function displayServer(options) {
        function status(flag) {
          return flag ? colors.yellow('enabled') : colors.gray('disabled');
        }
        // instantiate
        let head = ['App name', 'output', 'reload', 'launch', 'port', 'proxy-routes', 'proxy-model', 'user-agent', 'config-path'],
          chars;

        if (/^win/.test(process.platform)) {
          chars = {
            'top': ' ',
            'top-mid': ' ',
            'top-left': ' ',
            'top-right': ' ',
            'bottom': ' ',
            'bottom-mid': ' ',
            'bottom-left': ' ',
            'bottom-right': ' ',
            'left': ' ',
            'left-mid': ' ',
            'mid': ' ',
            'mid-mid': ' ',
            'right': ' ',
            'right-mid': ' ',
            'middle': ' '
          }
        } else {
          chars = {
            'top': '═',
            'top-mid': '╤',
            'top-left': '╔',
            'top-right': '╗',
            'bottom': '═',
            'bottom-mid': '╧',
            'bottom-left': '╚',
            'bottom-right': '╝',
            'left': '║',
            'left-mid': '╟',
            'mid': '─',
            'mid-mid': '┼',
            'right': '║',
            'right-mid': '╢',
            'middle': '│'
          }
        }

        head = head.map(function (item) {
          return colors.cyan(item);
        })
        let table = new Table({
          head: head,
          chars: chars,
          colWidths: [10, 13, 10, 10, 10, 14, 14, 14, 20]
        });
        let basenameSplits = path.basename(options.project).split('.');
        // table is an Array, so you can `push`, `unshift`, `splice` and friends
        table.push(
          [!!options.name ? options.name : 'app', options.output ? options.output : 'mock', status(options.reload), status(options.launch), options.port, status(options['proxy-routes']), status(options['proxy-model']), options['user-agent'], options['config-path'] ? options['config-path'] : 'server.config.js']
        );
        console.log(table.toString());
      }
      displayServer(this.options)

      console.log('代理服务器已成功启动,当前根路径为:' + colors.green(url));
      console.log('>>> NEI is working for you. Press Ctrl-C to stop.')
      // 自动打开浏览器
      if (options.launch) _.openBrowser(url);
    }.bind(this));

    server.on('close', function (err) {
      if (this.__isReset && !this.__reseting) {
        // 重置服务
        this.__isReset = false;

        if (err) {
          console.error('代理服务器重置失败,请使用ctrl+c关闭并重启')
          return process.exit(0);
        }

        console.log('正准备重置代理服务器......'.red);
        this.__reseting = true;
        this.init();
        this.start();
      }
    }.bind(this));

    server.on('connection', function (socket) {
      this.connection.push(socket);
    }.bind(this));
  },
  /**
   * 开启服务
   */
  start: function () {
    this.tries = 1;
    if (this.tries++ >= 10) {
      console.error('尝试新端口过多,请手动切换到其他端口');
      return process.exit(0);
    }
    this.server.listen(this.options.port);

    this.__reseting = false; // 重置完成
  },
  /**
   * 重置服务
   */
  reset: function (options) {
    this.options = _.extend(this.options, options, true);
    this.options.launch = false;
    this.__isReset = true;

    let socket;
    while (socket = this.connection.pop()) {
      socket.destroy();
    }
    this.server.close();
  }
};

module.exports = Server;