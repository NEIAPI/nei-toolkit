'use strict';
let fs = require('fs');
let path = require('path');
let chokidar = require('chokidar');
let glob = require("glob");
let mcss = require('mcss');

module.exports = function (options) {
  let cwd = options.dir;
  let io = (require('socket.io')).listen(options.server);

  let translateMcss = (filename, successCb) => {
    // 编译 mcss 文件
    let basename = path.basename(filename, '.mcss');
    if (basename.startsWith('_')) {
      return;
    }
    let outputFilename = `${path.dirname(filename)}/${basename}.css`;
    let mcssConfig = Object.assign(options.watchingFiles.compilers.mcss, {
      filename,
      dest: outputFilename
    });
    let instance = mcss(mcssConfig);
    instance.translate().done((text) => {
      console.log(`生成 css 文件: ${outputFilename}`);
      fs.writeFileSync(outputFilename, text);
      successCb && successCb(outputFilename);
    }).fail((error) => {
      console.log(`${filename} 编译失败: ${error}`);
    });
  };

  // 初始化时，把所有的mcss文件编译一遍
  if (options.watchingFiles && options.watchingFiles.compilers.mcss) {
    glob(`${options.dir}/**/*.mcss`, (er, files) => {
      files.forEach((file) => {
        translateMcss(file);
      });
    });
  }

  let changeHandler = (filename) => {
    let data = {"path": filename};
    let extname = path.extname(filename);
    if (extname === '.mcss' && options.watchingFiles && options.watchingFiles.compilers.mcss) {
      translateMcss(filename, (outputFilename) => {
        data.css = outputFilename.slice(cwd.length);
        console.log(`自动刷新浏览器: 文件 ${filename} 有变化`);
        io.emit('update', data);
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
  let watchOptions = {
    persistent: true,
    interval: 1000,
  };
  //todo: 如果 ignored 为空字符串，它的意思是不监听文件？
  if (options.watchingFiles && options.watchingFiles.ignored) {
    watchOptions.ignored = options.watchingFiles.ignored;
  }
  chokidar.watch([options.dir, options.views], watchOptions).on('change', changeHandler);

  return function livereload(req, res, next) {
    let clientName = '/nei.livereload.js';
    if (res.injector) {
      res.injector.push(`<script src="${clientName}"></script>`)
    }
    if (req.url === clientName) {
      return res.sendFile(path.join(__dirname, '../../client/bundle.js'))
    }
    next();
  }
}