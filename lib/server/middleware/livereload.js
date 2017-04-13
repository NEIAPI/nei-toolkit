'use strict';
let libPath = require('path');
let chokidar = require('chokidar');

module.exports = function (options) {
  let cwd = options.dir;
  let io = (require('socket.io')).listen(options.server);
  let changeHandler = (path) => {
    let data = {"path": path};
    let extname = libPath.extname(path);
    if (extname === '.css') {
      data.css = path.slice(cwd.length);
    }
    io.emit('update', data);
  };
  chokidar.watch([options.dir, options.views], {
    persistent: true,
    ignored: [options.exclude, /node_modules/]
  }).on('change', changeHandler);

  return function livereload(req, res, next) {
    let clientname = '/nei.livereload.js';
    if (res.injector) res.injector.push(`<script src="${clientname}"></script>`);
    if (req.url === clientname) {
      return res.sendFile(libPath.join(__dirname, '../../client/bundle.js'))
    }
    next();
  }
}