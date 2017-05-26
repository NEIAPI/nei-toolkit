'use strict';
let fs = require('fs');
let path = require('path');
let chokidar = require('chokidar');
let mcss = require('mcss');

module.exports = function (options) {
  let cwd = options.dir;
  let io = (require('socket.io')).listen(options.server);
  let changeHandler = (filename) => {
    let data = {"path": filename};
    let extname = path.extname(filename);
    if (extname === '.mcss' && options.watchingFiles && options.watchingFiles.compilers.mcss) {
      // 编译 mcss 文件
      let basename = path.basename(filename, '.mcss');
      if (basename.startsWith('_')) {
        return;
      }
      let file = `${path.dirname(filename)}/${basename}.css`;
      let instance = mcss({
        filename: filename,
        sourceMap: false,
        dest: file
      });
      instance.translate().done((text) => {
        console.log(`生成 css 文件: ${file}`);
        fs.writeFileSync(file, text);
        data.css = file.slice(cwd.length);
        console.log(`自动刷新浏览器: 文件 ${filename} 有变化`);
        io.emit('update', data);
      }).fail((error) => {
        console.log(`${filename} 编译失败: ${error}`);
      });
    } else {
      if (extname === '.css') {
        // 普通 css 文件
        data.css = filename.slice(cwd.length);
      }
      console.log(`自动刷新浏览器: 文件 ${filename} 有变化`);
      io.emit('update', data);
    }
  };
  chokidar.watch([options.dir, options.views], {
    persistent: true,
    interval: 1000,
    ignored: options.watchingFiles && options.watchingFiles.ignored
  }).on('change', changeHandler);

  return function livereload(req, res, next) {
    let clientname = '/nei.livereload.js';
    if (res.injector) res.injector.push(`<script src="${clientname}"></script>`);
    if (req.url === clientname) {
      return res.sendFile(path.join(__dirname, '../../client/bundle.js'))
    }
    next();
  }
}