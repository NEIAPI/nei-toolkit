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
      {% for rule in rules %}
      {%- if rule.list -%}
      "{{rule.method}} {{rule.path}}": {name: '{{rule.name}}', index: 0, list: {% autoescape false %}{{rule.list}}{% endautoescape %}}{% if !loop.last %},{% endif %}
      {%- else -%}
      "{{rule.method}} {{rule.path}}": {path: '{{rule.mockFile}}', id: '{{rule.id}}'}{% if !loop.last %},{% endif %}
      {%- endif -%}
      {%- endfor %}
    },
    /* 是否自动打开浏览器 */
    launch: true,
    /* 端口 */
    port: 8002,
    /* 同步模块mock数据路径 */
    mockTpl: '{{mockViewRoot}}',
    /* 异步接口mock数据路径 */
    mockApi: '{{mockApiRoot}}',
    /* 模板后缀 */
    viewExt: '.{{viewExt}}',
    /* 模板引擎 */
    engine: '{{engine}}'
};