var _ = require('./util');

// 路径配置
var ROOT = {
    PK: '',
    ONLINE: '',
    VIEW: '',
    MOCKTPL: '',
    MOCKAPI: ''
};

var VIEW_EXT = '';

// 从nei站点获取数据
function get(type, id, callback) {
    if (!ROOT.ONLINE) {
        // 不使用在线地址，则不获取数据
        return callback(null);
    }
    var url = `https://nei.netease.com/api/mockdata?id=${id}&type=${type}&key=${ROOT.PK}`;
    console.log(`Mock数据为NEI提供的在线接口: ${url}`);

    var isHttps = /^https:\/\//i.test(url);
    // 获取nei站点上的数据
    require(isHttps ? 'https' : 'http').get(url, function (res) {
        var ret = [];
        res.on('data', function (chunk) {
            ret.push(chunk.toString());
        });
        res.on('end', function () {
            var json = null;
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

// 加载数据
function load(type, id, path, callback) {
    var filter = null;
    try {
        var file = path + '.js';
        filter = require(file);
        delete require.cache[require.resolve(file)];
    } catch (ex) {
        // ignore
    }

    // 如果filter是个json对象
    if (filter && (typeof filter !== 'function')) {
        return callback(filter);
    }

    get(type, id, function (json) {
        if (json == null) {
            try {
                var file = path + '.json';
                console.log(`Mock数据为本地JSON文件: ${file}`);
                json = require(file);
                delete require.cache[require.resolve(file)];
            } catch (ex) {
                // ignore
            }
        }

        if (filter) {
            json = filter(json);
        }

        callback(json);
    });
}

// api代理
function wrapApi(id, path) {
    return function (req, res, next) {
        load(3, id, ROOT.MOCKAPI + path, function (json) {
            // 不能直接发送数字, 数字会当作响应码
            if (typeof json == 'number') {
                json = json.toString();
            }
            res.send(json);
        });
    };
}

// 页面代理
function wrapPage(index, list) {
    return function (req, res, next) {
        var conf = list[index];
        load(1, conf.i, ROOT.MOCKTPL + conf.p, function (json) {
            res.render(conf.p + VIEW_EXT, json);
        });
    };
}

module.exports = {
    // 设置接口
    setting: function (obj) {
        ROOT.PK = obj.projectKey;
        ROOT.ONLINE = obj.online;
        ROOT.VIEW = obj.view;
        ROOT.MOCKTPL = obj.mockTpl;
        ROOT.MOCKAPI = obj.mockApi;
        VIEW_EXT = obj.viewExt;
    },
    // 获取包装过的路由
    getRoutes: function (routes) {
        var retRoutes = {};
        Object.keys(routes || {}).forEach(function (i) {
            var item = routes[i];
            if (_.isObject(item)) {
                if (item.hasOwnProperty('list')) {
                    // 页面
                    var list = [];
                    item.list.forEach(function (it) {
                        list.push({i: it.id, p: it.path});
                    });

                    retRoutes[i] = {
                        nei: true,
                        data: item,
                        handle: wrapPage(item.index, list)
                    };
                } else {
                    // api
                    retRoutes[i] = {
                        nei: true,
                        data: item,
                        handle: wrapApi(item.id, item.path)
                    };
                }
            } else {
                retRoutes[i] = item;
            }
        });
        return retRoutes;
    }
};
