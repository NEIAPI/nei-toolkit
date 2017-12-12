'use strict'
const path = require('path');
const querystring = require("querystring");
const url = require('url');
const _ = require('./util');

// 路径配置
let ROOT = {
  PK: '',
  ONLINE: '',
  VIEW: '',
  MOCKTPL: '',
  MOCKAPI: '',
  FMPP: '',
  API_RES_HEADERS: ''
};

let VIEW_EXT = '';

// 从nei站点获取数据
function getFromNEISite(type, id, callback, req) {
  if (!ROOT.ONLINE) {
    // 不使用在线地址，则不获取数据
    return callback(null);
  }
  req = req || {};

  let params = {path: req.url, type: type, key: ROOT.PK, id: id, method: req.method};

  let url = `https://nei.netease.com/api/mockdata?` + querystring.stringify(params);
  // let url = `http://localhost:8082/api/mockdata?` + querystring.stringify(params);
  console.log(`Mock数据为NEI提供的在线接口: ${url}`);

  let isHttps = /^https:\/\//i.test(url);
  // 获取nei站点上的数据
  require(isHttps ? 'https' : 'http').get(url, function (res) {
    let ret = [];
    res.on('data', function (chunk) {
      ret.push(chunk.toString());
    });
    res.on('end', function () {
      let json = null;
      try {
        json = JSON.parse(ret.join(''));
      } catch (ex) {
        // ignore
      }
      if (json && json.code === 200) {
        // 成功
        if (json.result.error.length) {
          console.log(`错误: ${json.result.error.map(err => err.message).join(', ')}`);
        }
        // 真正的 mock 数据
        callback(json.result.json);
      } else {
        callback(ret.join(''))
      }
    });
  }).on('error', function (error) {
    callback(error.message);
  });
}

// 从 model server 加载注入给页面的模型数据
function getModelFromServer(pagePath, callback, req) {
  let modelServerOptions = ROOT.MODEL_SERVER;
  let reqUrl = modelServerOptions.path;
  if (typeof reqUrl === 'function') {
    reqUrl = reqUrl({
      host: modelServerOptions.host,
      queries: modelServerOptions.queries,
      headers: modelServerOptions.headers,
      path: pagePath
    });
  }
  // 如果没有设置path，则默认为页面的path
  if (!reqUrl) {
    reqUrl = pagePath;
  }
  if (!reqUrl.startsWith('http')) {
    if (!modelServerOptions.host.endsWith('/')) {
      modelServerOptions.host += '/';
    }
    if (reqUrl.startsWith('/')) {
      reqUrl = reqUrl.slice(1);
    }
    // 是相对地址，加上主机地址
    reqUrl = `${modelServerOptions.host}${reqUrl}`;
  }
  // 处理查询参数
  if (modelServerOptions.queries && Object.keys(modelServerOptions.queries).length) {
    let qs = querystring.stringify(modelServerOptions.queries);
    reqUrl += (reqUrl.includes('?') ? `&` : `?`) + qs;
  }
  let reqHeaders = {
    cookie: req.headers.cookie
  };
  // 处理请求头
  if (modelServerOptions.headers) {
    Object.keys(modelServerOptions.headers).forEach(function (headerKey) {
      reqHeaders[headerKey] = modelServerOptions.headers[headerKey];
    });
  }
  let urlParseResult = url.parse(reqUrl);
  let options = {
    hostname: urlParseResult.hostname,
    port: urlParseResult.port,
    path: urlParseResult.path,
    headers: reqHeaders,
    protocol: urlParseResult.protocol
  };
  console.log(`页面 ${pagePath} 的模型请求信息：${JSON.stringify(options)}`);
  require(urlParseResult.protocol.slice(0,-1)).get(options, function (res) {
    let ret = [];
    res.on('data', function (chunk) {
      ret.push(chunk.toString());
    });
    res.on('end', function () {
      let json = {};
      try {
        json = JSON.parse(ret.join(''));
        console.log(`页面 ${pagePath} 的模型请求返回的 json 数据为：${JSON.stringify(json)}`);
      } catch (ex) {
        console.log(`页面 ${pagePath} 的模型请求没有返回 json 数据：${JSON.stringify(ret)}`);
      }
      callback(json);
    });
  }).on('error', function (error) {
    callback(error.message);
  });
}

// 加载数据
function load(type, id, path, callback, req) {
  let filter = null;
  try {
    let file = path + '.js';
    filter = require(file);
    delete require.cache[require.resolve(file)];
  } catch (ex) {
    // ignore
  }

  // 如果filter是个json对象
  if (filter && (typeof filter !== 'function')) {
    return callback(filter);
  }

  getFromNEISite(type, id, function (json) {
    if (json == null) {
      try {
        let file = path + '.json';
        console.log(`Mock数据为本地JSON文件: ${file}`);
        json = require(file);
        delete require.cache[require.resolve(file)];
      } catch (ex) {
        // ignore
      }
    }

    if (filter) {
      json = filter(json, req);
    }

    callback(json);
  }, req);
}

// api代理
function wrapApi(id, path) {
  return function (req, res, next) {
    load(3, id, ROOT.MOCKAPI + path, function (json) {
      // 不能直接发送数字, 数字会当作响应码
      if (typeof json == 'number') {
        json = json.toString();
      }
      // 设置api响应头
      Object.keys(ROOT.API_RES_HEADERS).forEach((key) => {
        res.set(key, ROOT.API_RES_HEADERS[key]);
      });
      res.send(json);
    }, req);
  };
}

// 页面代理
function wrapPage(index, list) {
  return function (req, res, next) {
    let conf = list[index];
    let render = function (json) {
      if (VIEW_EXT.toLowerCase() === '.ftl') {
        // ftl 模板, 需要 node fmpp 处理
        // 如果不包裹一层，传递的时候 data 上会多出 settings 等字段，见 /node-fmpp/index.js
        res.render(conf.p + VIEW_EXT, {
          json: json,
          fmppConfig: ROOT.FMPP
        });
      } else {
        res.render(conf.p + VIEW_EXT, json);
      }
    }
    if (ROOT.MODEL_SERVER && ROOT.PROXY_MODEL) {
      getModelFromServer(req.originalUrl, function (json) {
        render(json);
      }, req);
    } else {
      load(1, conf.i, ROOT.MOCKTPL + conf.p, function (json) {
        render(json);
      }, req);
    }
  };
}

module.exports = {
  // 获取设置
  getting: function () {
    return ROOT;
  },
  // 设置接口
  setting: function (obj) {
    ROOT.PK = obj.projectKey;
    ROOT.ONLINE = obj.online;
    ROOT.VIEW = obj.view;
    ROOT.MOCKTPL = obj.mockTpl;
    ROOT.MOCKAPI = obj.mockApi;
    ROOT.CHANGEORIGIN = obj.changeOrigin;
    ROOT.FMPP = obj.fmpp;
    ROOT.API_RES_HEADERS = obj.apiResHeaders;
    ROOT.MODEL_SERVER = obj.modelServer;
    VIEW_EXT = obj.viewExt;
    ROOT.PROXY_MODEL = obj.proxyModel;
  },
  // 获取包装过的路由
  getRoutes: function (routes) {
    let retRoutes = {};
    Object.keys(routes || {}).forEach(function (routeKey) {
      let item = routes[routeKey];
      if (_.isObject(item)) {
        if (item.hasOwnProperty('list')) {
          // 页面
          let list = [];
          item.list.forEach(function (it) {
            list.push({i: it.id, p: it.path, pagePath: routeKey.split(' ')[1]});
          });

          retRoutes[routeKey] = {
            id: item.id,
            nei: true,
            data: item,
            handle: wrapPage(item.index, list)
          };
        } else {
          // api
          retRoutes[routeKey] = {
            nei: true,
            data: item,
            handle: wrapApi(item.id, item.path)
          };
        }
      } else {
        retRoutes[routeKey] = item;
      }
    });
    return retRoutes;
  }
};
