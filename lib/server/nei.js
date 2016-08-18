var libPath = require('path');
var _ = require('./util');

// 路径配置
var ROOT = {
    API: '',
    VIEW: '',
    MOCKTPL: '',
    MOCKAPI: ''
};

var VIEW_EXT = '';

// 从nei站点获取数据
function get(type, id, callback) {
  if(!ROOT.API) {
    // 不存在地址，则不获取数据
    callback(null);
    return;
  }

  var uri = require('util').format(ROOT.API, type, id);
  var https = /^https:\/\//i.test(uri);

  // 获取nei站点上的数据
  require(https ? 'https' : 'http').get(uri, function(res) {
    var ret = [];

    res.on('data',function(chunk) {
      ret.push(chunk.toString());
    });

    res.on('end',function() {
      var json = null;
      try {
        json = JSON.parse(ret.join(''));
      } catch(ex) {
        // ignore
      }

      callback((json||{}).result);
    });
  }).on('error', function(error) {
    callback(null);
  });
}

// 加载数据
function load(type, id, path, callback) {
  var filter = null;
  try {
    var file = path + '.js';
    filter = require(file);
    delete require.cache[require.resolve(file)];
  } catch(ex) {
    // ignore
  }

  // 如果filter是个json对象
  if(filter && typeof filter !== 'function') {
    callback(filter);
    return;
  }

  get(type, id, function(json) {
    if(json == null) {
      try {
        var file = path+'.json';
        json = require(file);
        delete require.cache[require.resolve(file)];
      } catch(ex) {
        // ignore
      }
    }

    if(filter) {
      json = filter(json);
    }

    callback(json);
  });
}

// api代理
function wrapApi(id, path) {
  return function(req, res, next) {
    load(3, id, ROOT.MOCKAPI+path, function(json) {
      res.send(json);
    });
  };
}

// 页面代理
function wrapPage(index, list) {
  return function(req, res, next) {
    var conf = list[index];
    load(1, conf.i, ROOT.MOCKTPL + conf.p, function(json) {
      res.render(conf.p + VIEW_EXT, json);
    });
  };
}

module.exports = {
  // 设置接口
  setting: function(obj) {
    ROOT.API = obj.api;
    ROOT.VIEW = obj.view;
    ROOT.MOCKTPL = obj.mockTpl;
    ROOT.MOCKAPI = obj.mockApi;
    VIEW_EXT = obj.viewExt;
  },
  // 获取包装过的路由
  getRoutes: function(routes) {
    var retRoutes = {};
    Object.keys(routes || {}).forEach(function(i) {
      var item = routes[i];
      if(_.isObject(item)) {
        var type = item.type.toLowerCase();
        if(type === 'api') {
          // api
          retRoutes[i] = {
            nei: true,
            type: type,
            data: item,
            handle: wrapApi(item.id, item.path)
          };
        } else if(type === 'tpl') {
          // 页面
          var list = [];
          item.list.forEach(function(it) {
            list.push({i: it.id, p: it.path});
          });

          retRoutes[i] = {
            nei: true,
            type: type,
            data: item,
            handle: wrapPage(item.index, list)
          };
        }
      } else {
        retRoutes[i] = item;
      }
    });
    return retRoutes;
  }
};
