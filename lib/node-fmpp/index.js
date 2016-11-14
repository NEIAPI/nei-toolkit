var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');

var exists = fs.exists || fs.access;
var existsSync = fs.existsSync || fs.accessSync;

var path2fmpp = path.join(__dirname, './bin/fmpp' + (process.platform === 'win32' ? '.bat' : ''));
var tmpDir = path.join(__dirname, '/./tmp/');

module.exports = function () {
    removeCache(tmpDir);

    return function (filename, data, callback) {
        var fmppConfig = data.fmppConfig;
        var rdname = randomname();
        var tmpHtml = path.join(tmpDir, rdname + '.html');
        var tmpTdd = path.join(tmpDir, rdname + '.tdd');
        var tmpConfig = path.join(tmpDir, rdname + '.fmpp');
        var json = JSON.stringify(data.json);

        if (!existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }
        fs.chmodSync(tmpDir, '0777');

        fs.writeFileSync(tmpTdd, json, 'utf8');
        fs.chmodSync(tmpTdd, '0777');

        var fmppData = `tdd(${tmpTdd})`;
        /* 暴露给模板的名称和jar中包名的对应关系 */
        Object.keys(fmppConfig.jarConfig || {}).forEach((key) => {
            fmppData += `\n{${key}:eval('new ${fmppConfig.jarConfig[key]}()')}`;
        });
        var config = [
            'sourceRoot:' + data.settings.views,
            'outputFile:' + tmpHtml,
            'sourceEncoding:UTF-8',
            'outputEncoding:UTF-8',
            `data:{${fmppData}}`
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

        fmpp.on('close', function (code) {
            if (~errorMsg.indexOf('>>> ABORTED! <<<') || code !== 0) {
                var isError = true;
                callback(errorMsg || 'uncatched freemarker parse Error occurs in ' + filename);
            }

            // 删除缓存配置文件
            fs.unlink(tmpConfig, function () {
            });
            // 删除缓存数据文件
            fs.unlink(tmpTdd, function () {
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
