'use strict'
var fs = require('fs');
var libPath = require('path');
var libUrl = require('url');
var ejs = require('ejs');
var _ = require('../util');

// 预览路由，针对nei项目
var tpl = fs.readFileSync(libPath.join(__dirname, './routeBoard.html'), 'utf8');
var render = ejs.compile(tpl);

function getPath(path) {
    var tmp = path.split(/\s+/);

    if (tmp[0] && tmp[1]) path = tmp[1];
    return path;
}

module.exports = function (options) {
    var projectId = libPath.basename(options.project).split('.')[1];
    var app = options.app;
    var rules = options.rules;

    return function (req, res, next) {
        var routes = [];
        /**
         * server静态页面增加接口列表
         * @author {abnerzheng}
         * @date {17.1.17}
         */
        
        /** @type {Array.<{group: string, api: Array.<Object>}>} */
        var apis = []; // 存放数据模型，按最后按分组名称排序
        var pathname = libUrl.parse(req.url).pathname;
        
        let groupBygroupName = function () {
            var result = {};
            return function (api) {
              if(api.group in result){
                  result[api.group].push(api);
              }else{
                  result[api.group] = [api];
              }
              return result;
            }
        };
        
        let transToArray = function (apis) {
           return Object.keys(apis).map(group=>{
                return {
                    group: group,
                    apis: apis[group]
                }
           })
        };

        if (pathname !== '/') {
            next();
            return;
        }

        if (typeof rules === 'string') {
            try {
                rules = require(rules);
            } catch (err) {
                console.error('当前路由文件路径不可用');
                next();
                return;
            }
        }

        if (_.isObject(rules)) {
            var apiGroupMethod = groupBygroupName();
            for (var i in rules) {
                var rule = rules[i];
                if(!rule.data) continue;
                if (rule.data && rule.data.hasOwnProperty('list')) {
                    routes.push({url: getPath(i), name: rule.data.name,id:rule.id});
                }else {
                    apis = apiGroupMethod({url: getPath(i), name: i, isGet: i.startsWith("GET"), group: rule.data.group,id:rule.data.id});
                }
            }
            apis = transToArray(apis);
        }

        let list = [];

        routes.forEach(function(item){
          item.isApi = false;
        })

        list = list.concat(routes);

        apis.forEach(function(item){
          item.apis.forEach(function(item){
            item.isApi = true;
          })
        })

        apis.forEach(function(item){
          list = list.concat(item.apis);
        })

        // 渲染页面
        var body = render({
            list: list,
            projectId: projectId
        });
        // 返回页面
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        return res.send(body);
    };
};
