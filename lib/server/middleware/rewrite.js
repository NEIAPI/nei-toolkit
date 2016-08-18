var libPath = require('path');
var libUrl = require('url');
var fs = require('fs');
var querystring = require('querystring');
var path2reg = require('path-to-regexp');
var jsonParser = require('body-parser').json();
var urlencoded = require('body-parser').urlencoded({extended: false});

var proxy = require('../proxy');
var _ = require('../util');

/**
 * 处理路由句柄
 */
function processHandle(handle, rulePath) {
  var type = typeof handle;
  var ruleDir;

  if(typeof rulePath === 'string') {
    ruleDir = libPath.dirname(rulePath);
  }else{
    ruleDir = process.cwd();
  }

  if(type === 'string') {
    if(handle.indexOf('http') === 0) {
      // http或https，代理到线上地址
      return function(req, res) {
        // 补全代理url
        var relUrl = _.resolveUrl(handle, req.params);
        if(relUrl !== handle){
          req.url = libUrl.parse(relUrl).path;
        }

        // 使用代理转发
        return proxy(req, res, {
          target: relUrl
        });
      };
    } else {
      return function(req, res, next) {
        var relativePath =  _.resolveUrl(handle, req.params);
        var filepath = libPath.resolve(ruleDir, relativePath);

        if(fs.existsSync(filepath)) {
          // 文件路径，返回文件
          return res.sendFile(filepath);
        }else{
          // 非文件路径，直接返回
          res.send(handle);
        }
      };
    }
  }

  // 函数
  if(typeof handle === 'function' || (_.isObject(handle) && handle.nei)) {
    handle = _.isObject(handle) ? handle.handle : handle;
    return function(req, res, next) {
      // 解决body Parser的异常
      jsonParser(req, res, function() {
        urlencoded(req, res, function() {
          handle(req, res, next);
        });
      });
    };
  }

  // 其他非函数的情况，如数值、布尔值之类，直接返回
  return function(req, res) {
    res.send(handle)
  };
}

/**
 * 创建路由对象
 */
function createRule(path, handle, rulePath) {
  var tmp = path.split(/\s+/);
  var method = 'all';
  var query = {};

  if(tmp[0] && tmp[1]) {
    method = tmp[0].toLowerCase();

    var arr = tmp[1].split('?');
    path = arr[0];
    query = querystring.parse((arr[1] || ''));
  }

  // 生成正则
  var regexp = path2reg(path);
  // 包装路由处理句柄
  handle = processHandle(handle, rulePath);

  return {
    method: method,
    path: path,
    regexp: regexp,
    keys: regexp.keys, // 针对带参数的路由
    handle: handle,
    query: query // 查询参数
  };
}

/**
 * 加载路由文件，遍历路由表
 */
function processRules(rules, dir) {
  var ruleCache = [];
  if(typeof rules === 'object') {
    // 传具体路由表
    for(var i in rules) {
      if(rules.hasOwnProperty(i)) ruleCache.push(createRule(i, rules[i], dir));
    }
  }
  return ruleCache;
}

// 重写中间件暴露接口
module.exports = function(options) {
  var rules = processRules(options.rules, options.dir);

  return function(req, res, next) {
    // 请求进来后的处理
    var url = libUrl.parse(req.url);
    var method = req.method.toLowerCase();
    var applied = [];

    // 遍历路由
    for(var i = 0, len = rules.length; i < len; i++ ) {
      var rule = rules[i];

      if((rule.method === 'all' || rule.method === method) && rule.regexp) {
        var params = _.getParam(rule.regexp, url.pathname);
        var isQueryRight = _.compareQuery(rule.query, req.query); // 比对查询参数

        if(params && rule.handle && isQueryRight) {
          // 当匹配到对应方法和路由的时候
          console.log('访问了 ----> ' + method.toUpperCase() + ' ' + url.pathname);
          applied.push({
            params: params,
            handle: rule.handle,
            path: rule.path
          });
        }
      }

    }

    // 逐个句柄触发
    var alen = applied.length;
    if(!alen) return next();

    var cursor = -1;
    function nextStep() {
      cursor ++;

      if(cursor === alen) return next();

      var step = applied[cursor];
      req.params = step.params;

      try {
        step.handle(req, res, nextStep)
      } catch(err) {
        console.error('进入路由' + step.path + '时发生了错误');
        console.error(err.stack);
        next();
      }
    }

    nextStep();
  }
}
