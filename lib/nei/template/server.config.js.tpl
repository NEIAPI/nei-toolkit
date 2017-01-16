/*
 * config file for nei server command
 * @author {{author}}
 * Auto build by NEI Builder
 */
var path = require('path');
module.exports = {
    /* 根目录 */
    webRoot: '{{webRoot}}',
    /* 视图目录 */
    viewRoot: '{{viewRoot}}',
    /* 路由 */
    routes: {
      //"ALL /api/*": "代理所有接口, 这里输入代理服务器地址",
      {{#each rules}}
      {{#if list}}
      "{{method}} {{{path}}}": { name: '{{name}}', index: 0, list: {{{list}}} },
      {{else}}
      "{{method}} {{{path}}}": { path: '{{mockFile}}', id: {{id}} },
      {{/if}}
      {{/each}}
    },
    customRoutes: {
        {{#each customRoutes}}
        {{#if list}}
        "{{method}} {{{path}}}": { name: '{{name}}', index: 0, list: {{{list}}} },
        {{else}}
        "{{method}} {{{path}}}": { path: '{{mockFile}}', id: {{id}} },
        {{/if}}
        {{/each}}
    },
    /* api 响应头 */
    {{#if apiResHeaders}}
    apiResHeaders: {
        {{#each apiResHeaders}}
        '{{@key}}': '{{this}}',
        {{/each}}
    },
    {{else}}
    apiResHeaders: {
        // 可跨域访问
        'Access-Control-Allow-Origin': '*'
    },
    {{/if}}
    /* 是否自动打开浏览器 */
    launch: {{launch}},
    /* 端口 */
    port: {{port}},
    /* 是否使用 https 协议 */
    https: {{https}},
    /* 是否使用 nei 提供的在线 mock 数据 */
    online: {{online}},
    /* 项目的 key */
    projectKey: '{{projectKey}}',
    /* 同步模块mock数据路径 */
    mockTpl: '{{mockViewRoot}}',
    /* 异步接口mock数据路径 */
    mockApi: '{{mockApiRoot}}',
    /* 模板后缀 */
    viewExt: '.{{viewExt}}',
    /* 模板引擎 */
    engine: '{{engine}}',
    /* 打开下面的 fmpp 配置，可以在模板中调用自定义 jar 包中的类 */
    {{#if fmpp}}
    fmpp: {
        /* 存放自定义 jar 的目录, 绝对路径 */
        jarDir: "{{fmpp.jarDir}}",
        /* 暴露给模板的类实例名称和 jar 中的类名(带包名)的对应关系 */
        jarConfig: {
            {{#each fmpp.jarConfig}}
            '{{@key}}': '{{this}}',
            {{/each}}
        }
    }
    {{else}}
    //fmpp: {
    //    /* 存放自定义 jar 的目录, 绝对路径 */
    //    jarDir: '',
    //    /* 暴露给模板的类实例名称和 jar 中的类名(带包名)的对应关系 */
    //    jarConfig: {
    //        [暴露给模板的类实例名称]: [类名] // 比如: HighlightUtil: 'yueduutil.HighlightUtil'
    //    }
    //}
    {{/if}}
};