/*
 * config file for nei server command
 * @author 
 * Auto build by NEI Builder
 */
var path = require('path');
module.exports = {
    /* 根目录 */
    webRoot: '',
    /* 视图目录 */
    viewRoot: '',
    /* 路由 */
    routes: {
      //"ALL /api/*": "代理所有接口, 这里输入代理服务器地址",
      "GET /usr/page/id": { name: 'ddd', index: 0, list: [{"id":11910,"path":"page/test"}] },
    },
    /* 是否自动打开浏览器 */
    launch: true,
    /* 端口 */
    port: 8002,
    /* 同步模块mock数据路径 */
    mockTpl: '',
    /* 异步接口mock数据路径 */
    mockApi: '',
    /* 模板后缀 */
    viewExt: '.',
    /* 模板引擎 */
    engine: ''
};