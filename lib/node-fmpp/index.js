var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var os = require('os');

var exists = fs.exists || fs.access;
var existsSync = fs.existsSync || fs.accessSync;

var path2fmpp = path.join(__dirname, './bin/fmpp' + (process.platform === 'win32' ? '.bat' : ''));
var tmpDir = path.join(os.tmpdir(), '/./nei/');

module.exports = function () {
  removeCache(tmpDir);

  return function (filename, data, callback) {
    var fmppConfig = data.fmppConfig;
    var rdname = randomname();
    var tmpHtml = path.join(tmpDir, rdname + '.html');
    var tmpJSON = path.join(tmpDir, rdname + '.json');
    var tmpConfig = path.join(tmpDir, rdname + '.fmpp');
    var json = JSON.stringify(data.json);

    if (!existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    fs.chmodSync(tmpDir, '0777');

    fs.writeFileSync(tmpJSON, json, 'utf8');
    fs.chmodSync(tmpJSON, '0777');

    var fmppData = `json(${tmpJSON})`;
    /* 暴露给模板的名称和jar中包名的对应关系 */
    Object.keys(fmppConfig.jarConfig || {}).forEach((key) => {
      fmppData += `\n{${key}:eval('new ${fmppConfig.jarConfig[key]}()')}`;
    });
    var config = [
      /*
      * sourceRoot 需要是存放项目所有 views 的目录，因为模板中有可能会互相 include，fmpp 需要有权限访问所有的 view
      */
      'sourceRoot:' + data.settings.views,
      'outputFile:' + tmpHtml,
      'sourceEncoding:UTF-8',
      'outputEncoding:UTF-8',
      `data:{${fmppData},NEIJSONUtil:com.netease.nei.fmpp.JSONFactory()}`
    ];
    fs.writeFileSync(tmpConfig, config.join('\n'), 'utf8');
    fs.chmodSync(tmpConfig, '0777');

    // 执行命令
    // 第一个参数在 shell 脚本中会处理掉，最终传给 fmpp 的参数从第二个开始计算
    var args = [fmppConfig.jarDir, filename, '-C', tmpConfig];
    // var args = [filename, '-D', data, '-o', tmpHtml, '-S', sourceRoot, '-E', 'UTF-8'];
    var fmpp = spawn(path2fmpp, args, {});

    var errorMsg = '';
    fmpp.stdout.on('data', function (data) {
      errorMsg += data.toString();
    });
    fmpp.on('error', function (data) {
      debugger
    })

    fmpp.on('close', function (code) {
      if (!errorMsg.startsWith('*** DONE ***') || code !== 0) {
        var isError = true;

        function checkJavaVersion(callback) {
          var spawn = require('child_process').spawn('java', ['-version']);
          spawn.on('error', function (err) {
            return callback(err, null);
          });
          // todo，这里会触发多次
          var isCallbacked = false;
          spawn.stderr.on('data', function (data) {
            data = data.toString().split('\n')[0];
            if (isCallbacked) {
              return;
            }
            isCallbacked = true;
            var javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
            if (javaVersion !== false) {
              return callback(null, javaVersion);
            } else {
              return callback(null, `没有安装`);
            }
          });
        }
        checkJavaVersion(function (err, version) {
          console.log(`Java 版本是：${version}`);
        });
        callback(errorMsg || '未知 freemarker 模板解析错误，请检查是否安装了 Java：' + filename);
      }

      // 删除缓存配置文件
      fs.unlink(tmpConfig, function () {
      });
      // 删除缓存数据文件
      fs.unlink(tmpJSON, function () {
      });
      // 删除缓存html文件并返回
      exists(tmpHtml, function (flag) {
        if (isError) return fs.unlink(tmpHtml, function () {
        });

        fs.readFile(tmpHtml, 'utf8', function (err, content) {
          callback(err, content);
          fs.unlink(tmpHtml, function () {
          });
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
    subs.forEach(function (file) {
      var filepath = path.join(dir, file);
      console.log('清理旧缓存：' + filepath);

      if (fs.statSync(filepath).isFile()) {
        // 文件
        fs.unlink(filepath, function () {
        });
      }
      if (fs.statSync(filepath).isDirectory()) {
        // 文件夹
        fs.rmdir(filepath, function () {
        });
      }
    });
  } catch (e) {
    // ignore
  }

}
