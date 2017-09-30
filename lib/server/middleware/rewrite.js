'use strict';
let libPath = require('path');
let libUrl = require('url');
let fs = require('fs');
let querystring = require('querystring');
let path2reg = require('path-to-regexp');
let jsonParser = require('body-parser').json();
let urlencoded = require('body-parser').urlencoded({extended: false});

let proxy = require('../proxy');
let _ = require('../util');

/**
 * 处理路由句柄
 */
function processHandle(handle, rulePath, changeOrigin) {
  let type = typeof handle;
  let ruleDir;

  if (typeof rulePath === 'string') {
    ruleDir = libPath.dirname(rulePath);
  } else {
    ruleDir = process.cwd();
  }

  if (type === 'string') {
    if (handle.indexOf('http') === 0) {
      // http或https，代理到线上地址
      return function (req, res) {
        // 补全代理url
        let relUrl = _.resolveUrl(handle, req.params);
        if (relUrl !== handle) {
          req.url = libUrl.parse(relUrl).path;
        }

        // 使用代理转发
        return proxy(req, res, {
          target: relUrl,
          changeOrigin: changeOrigin
        });
      };
    } else {
      return function (req, res, next) {
        let relativePath = _.resolveUrl(handle, req.params);
        let filepath = libPath.resolve(ruleDir, relativePath);

        if (fs.existsSync(filepath)) {
          // 文件路径，返回文件
          return res.sendFile(filepath);
        } else {
          // 非文件路径，直接返回
          res.send(handle);
        }
      };
    }
  }

  // {
  //  handle: 'xx',
  //  transform: xx
  // }
  if(typeof handle === 'object' ){
    let realHandle = processHandle(handle.handle, rulePath, changeOrigin);
    return function(req, res, next){
      res.nei_transform = handle.transform
      realHandle(req, res, next);
    }
  }

  // 函数
  if (typeof handle === 'function' || (_.isObject(handle) && handle.nei)) {
    handle = _.isObject(handle) ? handle.handle : handle;
    return function (req, res, next) {
      // 解决body Parser的异常
      jsonParser(req, res, function () {
        urlencoded(req, res, function () {
          handle(req, res, next);
        });
      });
    };
  }

  // 其他非函数的情况，如数值、布尔值之类，直接返回
  return function (req, res) {
    res.send(handle)
  };
}

/**
 * 创建路由对象
 */
function createRule(path, handle, rulePath, changeOrigin) {
  let tmp = path.split(/\s+/);
  let method = 'all';
  let query = {};

  if (tmp[0] && tmp[1]) {
    method = tmp[0].toLowerCase();
    tmp[1] = tmp[1].replace(/#.*$/, '');

    let arr = tmp[1].split('?');
    path = arr[0];
    query = querystring.parse((arr[1] || ''));
  }
  if (!path.startsWith('/')) { //当用户在nei上设置路径不以"/"开头时，应加上"/"，否则路由匹配不上
    path = "/" + path;
  }
  // 生成正则
  let regexp = path2reg(path);
  // 包装路由处理句柄
  if(handle.data && handle.data.isFile){
    handle = require.resolve('./file_temp.png');
  }
  handle = processHandle(handle, rulePath, changeOrigin);

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
function processRules(rules, dir, changeOrigin) {
  let ruleCache = [];
  if (typeof rules === 'object') {
    // 传具体路由表
    for (let i in rules) {
      if (rules.hasOwnProperty(i)) ruleCache.push(createRule(i, rules[i], dir, changeOrigin));
    }
  }
  return ruleCache;
}

// 重写中间件暴露接口
module.exports = function (options) {
  if(options.hasOwnProperty('changeOrigin') && !options.changeOrigin){// 之前的配置没有changeOrigin,向下兼容
    options.changeOrigin = false;
  }else {
    options.changeOrigin = true;
  }
  let rules = processRules(options.rules, options.dir, options.changeOrigin);

  return function (req, res, next) {
    // 请求进来后的处理
    let url = libUrl.parse(req.url);
    let method = req.method.toLowerCase();
    let applied = [];

    // 遍历路由
    for (let i = 0, len = rules.length; i < len; i++) {
      let rule = rules[i];

      if ((rule.method === 'all' || rule.method === method) && rule.regexp) {
        let params = _.getParam(rule.regexp, url.pathname);
        let isQueryRight = _.compareQuery(rule.query, req.query); // 比对查询参数

        if (params && rule.handle && isQueryRight) {
          // 当匹配到对应方法和路由的时候
          console.log('访问了 ----> ' + method.toUpperCase() + ' ' + url.pathname);
          applied.push({
            params: params,
            handle: rule.handle,
            path: rule.path
          });
          break
        }
      }
    }

    // 逐个句柄触发
    let alen = applied.length;
    if (!alen) return next();

    let cursor = -1;

    function nextStep() {
      cursor++;

      if (cursor === alen) return next();

      let step = applied[cursor];
      req.params = step.params;

      try {
        step.handle(req, res, nextStep)
      } catch (err) {
        console.error('进入路由' + step.path + '时发生了错误');
        console.error(err.stack);
        next();
      }
    }

    nextStep();
  }
}
