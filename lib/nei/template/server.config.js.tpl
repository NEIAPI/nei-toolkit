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
{{#if value}}
        "{{method}} {{{path}}}": '{{value}}',
{{else if list}}
        "{{method}} {{{path}}}": { name: '{{name}}', index: 0, list: {{{list}}} },
{{else if isFile}}
        "{{method}} {{{path}}}": { path: '{{mockFile}}', id: {{id}}, group: '{{{group}}}',isFile: {{isFile}} },
{{else}}
        "{{method}} {{{path}}}": { path: '{{mockFile}}', id: {{id}}, group: '{{{group}}}' },
{{/if}}
{{/each}}
    },
    /* 注入给页面的模型数据的服务器配置 */
    {{#if modelServer}}
    modelServer: {
        // 完整的主机地址，包括协议、主机名、端口
        host: '{{modelServer.host}}',
        // 查询参数
        queries: {{{JSONStringify modelServer.queries}}},
        // 自定义请求头
        headers: {{{JSONStringify modelServer.headers}}},
        // path 可以是字符串，也可以是函数；默认不用传，即使用 host + 页面path + queries 的值
        // 如果是函数，则使用函数的返回值，传给函数的参数 options 是一个对象，它包含 host、path（页面的path）、queries、headers 等参数
        // 如果 path 的值为假值，则使用 host + 页面path + queries 的值；
        // 如果 path 的值是相对地址，则会在前面加上 host
        {{#if modelServer.path}}
        path: {{{modelServer.path}}}
        {{else}}
        // path: function (options) {
        //
        // }
        {{/if}}
    },
    {{else}}
    // modelServer: {
    //     // 完整的主机地址，包括协议、主机名、端口
    //     host: '',
    //     // 查询参数，键值对
    //     queries: {},
    //     // 自定义请求头，键值对
    //     headers: {},
    //     // path 可以是字符串，也可以是函数；默认不用传，即使用 host + 页面path + queries 的值
    //     // 如果是函数，则使用函数的返回值，传给函数的参数 options 是一个对象，它包含 host、path（页面path）、queries、headers 等参数
    //     // 如果 path 的值为假值，则使用 host + 页面path + queries 的值；
    //     // 如果 path 的值是相对地址，则会在前面加上 host
    //     // path: '',
    // },
    {{/if}}
    /* api 响应头 */
    {{#if apiResHeaders}}
    apiResHeaders: {
        {{#each apiResHeaders}}
        '{{@key}}': '{{this}}',
        {{/each}}
    },
    {{else}}
    apiResHeaders: {
    },
    {{/if}}
    /* 是否自动打开浏览器 */
    launch: {{launch}},
    /* 自动打开的页面地址 */
    openUrl: '{{openUrl}}',
    /* 端口 */
    port: {{port}},
    /* 是否使用 https 协议，设为true的时候表示启用 */
    https: {{https}},
    /* 是否使用 nei 提供的在线 mock 数据 */
    online: {{online}},
    /* 是否监听静态文件和模板文件的变化并自动刷新浏览器 */
    reload: {{reload}},
    /* 文件监听的选项 */
    watchingFiles: {
        /* 需要即时编译的文件, 前提是 reload 为 true */
        compilers: {
            /* 值为 mcss 的配置选项, 默认为 false，即不编译 mcss 文件 */
            mcss: {{{JSONStringify watchingFiles.compilers.mcss}}}
        },
        /* 不用监听的文件，支持通配符 */
        {{!-- {{没有忽略的文件时，不要传 ignored 参数}} --}}
        {{#if watchingFiles.ignored}}ignored: '{{watchingFiles.ignored}}' {{else}}//ignored: '**/*.css'{{/if}}
    },
    /* 项目的 key */
    projectKey: '{{projectKey}}',
    /* 同步模块mock数据路径 */
    mockTpl: '{{mockViewRoot}}',
    /* 异步接口mock数据路径 */
    mockApi: '{{mockApiRoot}}',
    /* 是否修改代理的host */
    changeOrigin: true,
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