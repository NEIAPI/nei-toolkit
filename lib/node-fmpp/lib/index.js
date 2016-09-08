var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');

var exists = fs.exists || fs.access;
var existsSync = fs.existsSync || fs.accessSync;

var path2fmpp = path.join(__dirname, './libs/bin/fmpp' + (process.platform === 'win32' ? '.bat' : ''));
var tmpDir = path.join(__dirname, '/./tmp/');

module.exports = function() {
  removeCache(tmpDir);

  return function(filename, data, callback) {
    var sourceRoot = data.settings.views;
    // 清理data中的无用字段
    delete data.settings;
    delete data._locals;
    delete data.cache;

    var data = JSON.stringify(data);

    var rdname = randomname();
    var tmpHtml = path.join(tmpDir, rdname + '.html');
    var tmpHtml = path.join(tmpDir, rdname + '.html');
    var tmpTdd = path.join(tmpDir, rdname + '.tdd');
    var tmpConfig = path.join(tmpDir, rdname + '.fmpp');

    if(!existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    fs.chmodSync(tmpDir, '0777');

    fs.writeFileSync(tmpTdd, data, 'utf8');
    fs.chmodSync(tmpTdd, '0777');

    var config = [
      'sourceRoot:' + sourceRoot,
      'outputFile:' + tmpHtml,
      'sourceEncoding:UTF-8',
      'outputEncoding:UTF-8',
      'data:tdd(' + tmpTdd + ')'
    ];
    fs.writeFileSync(tmpConfig, config.join('\n'), 'utf8');
    fs.chmodSync(tmpConfig, '0777');

    // 执行命令
    var args = [filename, '-C', tmpConfig];
    // var args = [filename, '-D', data, '-o', tmpHtml, '-S', sourceRoot, '-E', 'UTF-8'];
    var fmpp = spawn(path2fmpp, args, {});

    var errorMsg = '';
    fmpp.stdout.on('data', function (data) {
      errorMsg += data.toString();
    });

    fmpp.on('close', function(code) {
      if(~errorMsg.indexOf('>>> ABORTED! <<<') || code !== 0) {
        var isError = true;
        callback(errorMsg || 'uncatched freemarker parse Error occurs in ' + filename);
      }

      // 删除缓存配置文件
      fs.unlink(tmpConfig, function() {});
      // 删除缓存数据文件
      fs.unlink(tmpTdd, function() {});
      // 删除缓存html文件并返回
      exists(tmpHtml, function(flag) {
        if(isError) return fs.unlink(tmpHtml, function() {});

        fs.readFile(tmpHtml, 'utf8', function(err, content) {
          callback(err, content);
          fs.unlink(tmpHtml, function() {});
        });
      });
    });

  }
}

function randomname() {
  return 'tmp' + (+new Date);
}

function removeCache(dir) {
  try {
    var subs = fs.readdirSync(dir);
    subs.forEach(function(file) {
      var filepath = path.join(dir, file);
      console.log('清理旧缓存：' + filepath);

      if(fs.statSync(filepath).isFile()) {
        // 文件
        fs.unlink(filepath, function() {});
      }
      if(fs.statSync(filepath).isDirectory()) {
        // 文件夹
        fs.rmdir(filepath, function() {});
      }
    });
  } catch(e) {
    // ignore
  }

}
