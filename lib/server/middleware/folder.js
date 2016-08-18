var fs = require('fs');
var libPath = require('path');
var libUrl = require('url');
var ejs = require('ejs');

var _ = require('../util');

// 预览文件模板
var tpl = fs.readFileSync( libPath.join(__dirname, './folder.html'), 'utf8');
var render = ejs.compile(tpl);

module.exports = function(options) {
  var app = options.app;

  return function(req, res, next) {
    var pathname = libUrl.parse(req.url).pathname;
    var path = libPath.join(options.dir, pathname);

    if(pathname !== '/'){
      var prevpath = pathname.replace(/\/[^\/]*\/?$/, '')
    }

    return fs.stat(path, function(err, stats) {
      if((err != null) || !stats.isDirectory()) {
        return next();
      }

      var files = [];
      var folders = [];
      return fs.readdir(path, function(err, subs) {
        if(err != null) {
          return next();
        }

        var body;
        subs.forEach(function(file) {
          var filepath = libPath.join(path, file);
          if(fs.statSync(filepath).isFile()) {
            // 文件
            files.push(file);
          }
          if(fs.statSync(filepath).isDirectory()) {
            // 文件夹
            folders.push(file);
          }
        });

        var locals = {
          join: libPath.join,
          files: files,
          folders: folders,
          prevpath: prevpath,
          pathname: pathname,
          options: options,
          ips: _.getIPs(),
          qrcode: _.getQRCode(_.getFullUrl(req), 2).createImgTag(4)
        };
        // 渲染页面
        var body = render(locals);
        // 返回页面
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        return res.send(body);
      });
    });
  };
};
