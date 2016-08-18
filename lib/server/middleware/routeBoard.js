var fs = require('fs');
var libPath = require('path');
var libUrl = require('url');
var ejs = require('ejs');

var _ = require('../util');

// 预览路由，针对nei项目
var tpl = fs.readFileSync( libPath.join(__dirname, './routeBoard.html'), 'utf8');
var render = ejs.compile(tpl);

function getPath(path) {
  var tmp = path.split(/\s+/);

  if(tmp[0] && tmp[1]) path = tmp[1];
  return path;
}

module.exports = function(options) {
  var app = options.app;
  var rules = options.rules;

  return function(req, res, next) {
    var routes = [];
    var pathname = libUrl.parse(req.url).pathname;

    if(pathname !== '/'){
      next();
      return;
    }

    if(typeof rules === 'string') {
      try {
        rules = require(rules);
      } catch(err) {
        console.error('当前路由文件路径不可用');
        next();
        return;
      }
    }

    if(_.isObject(rules)) {
      for(var i in rules) {
        var rule = rules[i];
        if(rule.type === 'tpl') {
          routes.push({url: getPath(i), name: rule.data.name});
        }
      }
    }

    // 渲染页面
    var body = render({
      routes: routes
    });
    // 返回页面
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    return res.send(body);
  };
};
