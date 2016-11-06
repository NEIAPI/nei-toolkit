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
    /* 是否自动打开浏览器 */
    launch: {{launch}},
    /* 端口 */
    port: {{port}},
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
    engine: '{{engine}}'
};