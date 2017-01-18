/*
 * config file for nei server command
 * @author 
 * Auto build by NEI Builder
 */
var path = require('path');
module.exports = {
    /* 根目录 */
    webRoot: '/Users/abnerzheng/netease/nei-toolkit/test/httpsServerDemo/ks-active/public/',
    /* 视图目录 */
    viewRoot: '/Users/abnerzheng/netease/nei-toolkit/test/httpsServerDemo/ks-active/view/',
    /* 路由 */
    routes: {
      //"ALL /api/*": "代理所有接口, 这里输入代理服务器地址",
      "GET /index": { name: 'index', index: 0, list: [{"id":12518,"path":"active"}] },
      "GET /api/rule:id": { path: 'get/api/rule/_/id/data', id: 24451, group: '测试' },
      "POST /annual/blog/vote": { path: 'post/annual/blog/vote/data', id: 24272, group: '默认分组' },
      "GET /annual/blog/2016": { path: 'get/annual/blog/2016/data', id: 24306, group: '默认分组' },
      "GET /annual/2016": { name: '年度评选页面', index: 0, list: [{"id":12518,"path":"active"}] },
    },
    /* api 响应头 */
    apiResHeaders: {
        'Access-Control-Allow-Origin': '*',
    },
    /* 是否自动打开浏览器 */
    launch: true,
    /* 端口 */
    port: 8002,
    /* 是否使用 https 协议，设为true的时候表示启用 */
    https: false,
    /* 是否使用 nei 提供的在线 mock 数据 */
    online: false,
    /* 项目的 key */
    projectKey: 'e8f8aae204c40384f8a690ae672fb444',
    /* 同步模块mock数据路径 */
    mockTpl: '/Users/abnerzheng/netease/nei-toolkit/test/httpsServerDemo/ks-active/mock.data/template/',
    /* 异步接口mock数据路径 */
    mockApi: '/Users/abnerzheng/netease/nei-toolkit/test/httpsServerDemo/ks-active/mock.data/interface/',
    /* 模板后缀 */
    viewExt: '.ftl',
    /* 模板引擎 */
    engine: 'freemarker',
    /* 打开下面的 fmpp 配置，可以在模板中调用自定义 jar 包中的类 */
    //fmpp: {
    //    /* 存放自定义 jar 的目录, 绝对路径 */
    //    jarDir: '',
    //    /* 暴露给模板的类实例名称和 jar 中的类名(带包名)的对应关系 */
    //    jarConfig: {
    //        [暴露给模板的类实例名称]: [类名] // 比如: HighlightUtil: 'yueduutil.HighlightUtil'
    //    }
    //}
};