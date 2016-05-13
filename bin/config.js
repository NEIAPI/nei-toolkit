/*
 * arguments config
 * @author  huntbao
 */
module.exports = {
    "-default": [
        "Toolkit %v",
        "",
        "使用说明：",
        "nei [命令] [参数]",
        "",
        "参数说明：",
        "%p",
        "",
        "命令说明：",
        "build\t\t\t根据 NEI 平台信息构建项目结构",
        "update\t\t\t更新通过 'nei build' 构建的项目",
        "mock\t\t\t根据 NEI 平台信息生成测试数据",
        "mobile\t\t\t生成移动平台代码",
        "server\t\t\t启动本地模拟容器"
    ],
    "-default-params": [
        {
            "j": "v", // `jian(简称)`
            "q": "version", // `quan(全称)`
            "m": "显示工具版本信息" // `comment`
        },
        {
            "j": "h",
            "q": "help",
            "m": "显示指定命令的帮助信息"
        }
    ],
    "build": [
        "使用说明：",
        "nei build <IDS> [参数]",
        "",
        "<IDS>\t\t\tNEI 平台中对应的项目 ID，必须输入，多个项目 ID 用逗号分隔",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei build 23456798,452178 -w",
        "nei build 23456798 -p /path/to/project/"
    ],
    "build-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示 build 命令帮助信息"
        },
        {
            "j": "c",
            "q": "config",
            "d": "", // `default`
            "p": true, // `path` 参数, 需要读取它指定文件中的数据, 合并到参数列表中
            "m": "参数配置文件路径，避免命令行参数太多导致书写不便"
        },
        {
            "j": "p",
            "q": "project",
            "d": "./",
            "rp": true, // `relative path` of `config` parameter
            "m": "指定项目目录，默认为当前目录"
        },
        {
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的 MOCK 数据文件"
        },
        {
            "j": "t",
            "q": "template",
            "d": "webapp",
            "m": "指定用于构建的模板实现文件"
        },
        {
            "j": "pt",
            "q": "projectType",
            "d": "hz.netease",
            "m": "项目类型"
        },
        "",
        "以下参数对于使用 webapp 模板的项目特有：",
        {
            "q": "engine",
            "m": "如果使用内建的 webapp 模板构建，此参数用于指定使用的模板引擎，支持内建模板引擎：freemarker、velocity，默认为 freemarker 引擎",
            "f": "webapp" // for `webapp` only
        },
        {
            "q": "webRoot",
            "m": "如果使用内建的 webapp 模板构建，此参数用于指定 WEBROOT 目录，默认根据 maven 目录结构规范，相对于 -p 路径的 src/main/webapp/",
            "f": "webapp"
        },
        {
            "q": "viewRoot",
            "m": "如果使用内建的 webapp模板构建，此参数用于指定服务器端视图模板目录，默认根据 maven 目录结构规范，相对于 -p 路径的 src/main/webapp/WEB-INF/views/",
            "f": "webapp"
        },
        {
            "q": "deployRoot",
            "m": "deploy 文件夹的路径, 相对于 project 参数, 默认放在 project 指定路径的根目录",
            "f": "webapp"
        },
        {
            "q": "tMockRoot",
            "m": "template mock 数据文件夹的路径, 相对于 project 参数, 默认放在 src/main/webapp/src/mock/",
            "f": "webapp"
        },
        {
            "q": "iMockRoot",
            "m": "interface mock 数据文件夹的路径, 相对于 project 参数, 默认放在 src/main/webapp/WEB_INF/views/mock/",
            "f": "webapp"
        },
        {
            "q": "mcss",
            "m": "是否需要生成 mcss 代码",
            "d": true,
            "f": "webapp"
        },
        {
            "q": "bower",
            "m": "是否需要安装 bower 依赖",
            "d": false,
            "f": "webapp"
        },
        "",
        "以下参数对于使用 mobile 模板的项目特有：",
        {
            "j": "l",
            "q": "lang",
            "d": "oc",
            "m": "要导出的语言标识，支持的语言有 oc、java 等",
            "f": "mobile"  // `for` `mobile` only
        },
        {
            "q": "author",
            "d": "netease",
            "m": "构建者名称",
            "f": "mobile"
        },
        {
            "q": "reqAbstract",
            "d": "HTBaseRequest",
            "m": "请求基类名称，不带类名的前缀。如果指定语言是 Java，它的默认值为 BaseHttpStringRequestTask",
            "f": "mobile"
        },
        {
            "q": "modelAbstract",
            "d": "HTHTTPModel",
            "m": "数据模型基类名称，不带类名的前缀",
            "f": "mobile"
        },
        {
            "q": "resOut",
            "m": "生成的 NEI 资源相对工程的路径，如不指定，Java 工程的值为'app/src/main/hthttp-gen/'，Objective-C 工程的值为'{产品名}+/NetWork/'",
            "f": "mobile"
        },
        {
            "j": "tp",
            "q": "templatePath",
            "d": "",
            "rp": true,
            "m": "模板路径，默认为空，使用时必须指定",
            "f": "mobile"
        },
        {
            "j": "tdp",
            "q": "templateDataPath",
            "d": "",
            "rp": true,
            "m": "模板的数据文件路径，默认为空，文件内容须是有效的 json",
            "f": "mobile"
        },
        "",
        "以下参数在生成 mobile 项目的 Objective-C 模型和请求文件时特有：",
        {
            "q": "namePrefix",
            "d": "HT",
            "m": "生成的文件名、类名的前缀，默认为 HT",
            "f": "mobile-oc" // `for` `mobile` `objective-c` only
        },
        {
            "q": "reqHeaders",
            "d": "Requests",
            "m": "包含所有数据请求的头文件名称，不带类名的前缀",
            "f": "mobile-oc"
        },
        {
            "q": "modelHeaders",
            "d": "Models",
            "m": "包含所有数据模型的头文件名称，不带类名的前缀",
            "f": "mobile-oc"
        },
        {
            "q": "updateProject",
            "d": false,
            "m": "是否将模板文件夹下的文件添加到Xcode工程中",
            "f": "mobile-oc"
        },
        "",
        "以下参数在生成 mobile 项目的 Java 模型和请求文件时特有：",
        {
            "q": "appPackage",
            "d": "com.netease",
            "m": "应用的包名",
            "f": "mobile-java" // `for` `mobile` `java` only
        },
        {
            "q": "modelPackage",
            "d": "hthttp.model",
            "m": "模型的相对包名",
            "f": "mobile-java"
        },
        {
            "q": "reqPackage",
            "d": "hthttp.httptask",
            "m": "http请求的相对包名",
            "f": "mobile-java"
        },
        "",
        "以下参数对于使用 Node.js 模板的项目特有：",
        {
            "q": "engine",
            "d": "ejs",
            "m": "模板引擎，如 EJS、Jade、Handlebars、Hogan.js 等，默认为 EJS 引擎",
            "f": "node" // for `node` only
        },
        {
            "q": "author",
            "d": "netease",
            "m": "构建者名称",
            "f": "node"
        },
        {
            "q": "projectName",
            "d": "node_project",
            "m": "项目名称, 请使用小写",
            "f": "node"
        },
        {
            "q": "mcss",
            "m": "是否使用 mcss",
            "d": true,
            "f": "node"
        },
        {
            "q": "npm",
            "m": "是否需要自动安装 npm 依赖",
            "d": false,
            "f": "node"
        },
        {
            "q": "bower",
            "m": "是否需要自动安装 nej 和 Regularjs 的 Bower 依赖",
            "d": false,
            "f": "node"
        }
    ],
    "update": [
        "使用说明：",
        "nei update [IDS] [参数]",
        "",
        "[IDS]\t\t\tNEI平台中对应的项目 ID，多个项目 ID 用逗号分隔，不传则表示更新所有已生成的项目",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei update 23456798",
        "nei update -p /path/to/project/"
    ],
    "update-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示 update 命令帮助信息"
        },
        {
            "j": "p",
            "q": "project",
            "d": "./",
            "m": "指定项目目录，默认为当前目录。"
        },
        {
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的 mock 数据文件，默认不覆盖"
        },
        {
            "q": "tag",
            "m": "只更新含有指定 tag 的模板, 默认全部更新"
        },
        {
            "q": "view", // see @issues#3
            "m": "是否需要更新页面的模板文件和相应的 js 模块代码",
            "d": true
        }
    ],
    "mock": [
        "使用说明：",
        "nei mock <ID> [参数]",
        "",
        "<ID>\t\t\tNEI平台中对应的项目ID，必须输入",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei mock 23456798",
        "nei mock 23456798 -o /path/to/output/"
    ],
    "mock-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示mock命令帮助信息"
        },
        {
            "j": "o",
            "q": "output",
            "d": "./",
            "m": "指定输出目录，默认为当前目录"
        },
        {
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的MOCK数据文件，默认不覆盖"
        },
        {
            "j": "t",
            "q": "type",
            "d": 0,
            "m": "要导出的数据类型，0：模板+接口，1：模板，2：接口，默认为0"
        },
        {
            "j": "f",
            "q": "fiddler",
            "d": false,
            "m": "如果type是0或者2的情况可以用此参数配置是否导出fiddler配置文件，默认不导出"
        },
        {
            "j": "c",
            "q": "charles",
            "d": false,
            "m": "如果type是0或者2的情况可以用此参数配置是否导出charles配置文件，默认不导出"
        }
    ],
    "mobile": [
        "使用说明：",
        "nei mobile <ID> [参数]",
        "",
        "<ID>\t\t\tNEI平台中对应的项目ID，必须输入",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei mobile 2345",
        "nei mobile 23456798 -l java -o /path/to/output/"
    ],
    "mobile-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示 mobile 命令帮助信息"
        },
        {
            "j": "c",
            "q": "config",
            "d": "",
            "p": true,
            "m": "参数配置文件路径，避免命令行参数太多导致书写不便"
        },
        {
            "j": "o",
            "q": "output",
            "d": "./",
            "rp": true,
            "m": "指定输出目录，默认为当前目录"
        },
        {
            "j": "l",
            "q": "lang",
            "d": "oc",
            "m": "要导出的语言标识，支持的语言有 oc、java 等"
        },
        {
            "q": "author",
            "d": "netease",
            "m": "构建者名称，默认为 netease"
        },
        {
            "q": "reqAbstract",
            "d": "HTBaseRequest",
            "m": "请求基类名称，不带类名的前缀"
        },
        {
            "q": "modelAbstract",
            "d": "HTHTTPModel",
            "m": "数据模型基类名称，不带类名的前缀"
        },
        {
            "q": "resOut",
            "m": "生成的 NEI 资源相对工程的路径，如不指定，语言为 Java 是值为'app/src/main/hthttp-gen/'，语言为 Objective-C 时值为'{产品名}+/NetWork/'"
        },
        "",
        "以下参数在生成 Objective-C 模型和请求文件时特有：",
        {
            "q": "namePrefix",
            "d": "HT",
            "m": "生成的文件名、类名的前缀"
        },
        {
            "q": "reqHeaders",
            "d": "Requests",
            "m": "包含所有数据请求的头文件名称，不带类名的前缀"
        },
        {
            "q": "modelHeaders",
            "d": "Models",
            "m": "包含所有数据模型的头文件名称，不带类名的前缀"
        },
        {
            "j": "f",
            "q": "force",
            "d": false,
            "m": "在生成资源文件时，是否强制更新 .pbxproj 工程文件"
        },
        "",
        "以下参数在生成 Java 模型和请求文件时特有：",
        {
            "q": "appPackage",
            "d": "com.netease",
            "m": "应用的包名"
        },
        {
            "q": "modelPackage",
            "d": "hthttp.model",
            "m": "模型的相对包名"
        },
        {
            "q": "reqPackage",
            "d": "hthttp.httptask",
            "m": "http请求的相对包名"
        }
    ],
    "server": [
        "使用说明：",
        "nei server [<ID>] [参数]",
        "",
        "<ID>\t\t\tNEI 平台中对应的项目 ID",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei server",
        "nei server 234567 -p ./webapp"
    ],
    "server-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示 server 命令帮助信息"
        },
        {
            "j": "p",
            "q": "path",
            "d": "./",
            "m": "项目根路径"
        }
    ]
};