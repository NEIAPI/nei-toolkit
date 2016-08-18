var program = require('commander');
var path = require('path');
var fs = require('fs');
var Server = require('./main');
var _ = require('./util');

var cwd = process.cwd();

program
  .version(require('../package.json').version)

  .option('-p, --port <port>', '代理服务器端口，默认为8000', parseInt)
  .option('-c, --config [path]', '配置文件路径，默认取当前路径下的jtr.js')
  .option('-d, --dir [path]', '代理服务器的根目录，默认是process.cwd()')
  .option('--no-launch', '是否要停止自动打开浏览器')

  .parse(process.argv)

  .once('done', function(createFile) {
    // 获取参数
    var options = {
      port: program.port,
      rules: program.rules,
      dir: program.dir,
      views: program.views,
      launch: program.launch,
      engine: program.engine,
      config: program.config
    };

    // 启动代理服务器
    var server = new Server(program);
    server.start();
  });

// 默认配置文件是当前目录的jtr.js文件
var defaultFile = path.join(cwd, 'jtr.js');
if(program.config === undefined && fs.existsSync(defaultFile) || program.config === true) {
  program.config = defaultFile;
}

// 配置文件读取
if(program.config) {
  program.config = path.resolve(cwd, program.config);

  if(fs.existsSync(program.config)) {
    // 配置文件存在
    try {
      var configOptions = require(program.config);
      _.extend(program, configOptions);
    } catch(err) {
      // 配置文件读取失败
      console.error('读取文件' + program.config + '失败');
      console.error(err.stack);
      process.exit(1);
    }

    // 切换到配置文件的工作目录
    process.chdir(path.dirname(program.config));
    program.emit('done');
  } else {
    // 配置文件不存在
    console.error(program.config + '文件不存在');
    console.log('jtr将结束服务');
    process.exit(0);
  }
} else {
  program.emit('done');
}
