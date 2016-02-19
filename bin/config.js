/*
 * arguments config ported from nei.json
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
        "export\t\t\t导出第三方工具的配置文件",
        "mock\t\t\t根据 NEI 平台信息生成测试数据",
        "mobile\t\t\t生成移动平台代码"
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
            "p": true, // `path`
            "m": "参数配置文件路径，避免命令行参数太多导致书写不便"
        },
        {
            "j": "p",
            "q": "project",
            "d": "./",
            "rp": true, // `relative path` of `config` parameter
            "m": "指定项目目录，默认为当前目录。"
        },
        {
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的 MOCK 数据文件，默认不覆盖"
        },
        {
            "j": "t",
            "q": "template",
            "d": "webapp",
            "m": "指定用于构建的模板实现文件，默认使用内建的 webapp 模板构建"
        },
        {
            "j": "tp",
            "q": "templatePath",
            "d": "",
            "rp": true,
            "m": "模板路径，默认为空，使用时必须指定"
        },
        {
            "j": "tdp",
            "q": "templateDataPath",
            "d": "",
            "rp": true,
            "m": "模板的数据文件路径，默认为空，文件内容须是有效的 json"
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
            "m": "如果使用内建的 webapp 模板构建，此参数用于指定使用的模板引擎，支持内建模板引擎：freemarker、velocity、其他 nodejs 模板引擎，默认为 freemarker 引擎",
            "f": "w" // `for` `webapp` only
        },
        {
            "q": "engineRoot",
            "m": "engine 文件路径, 默认通过 bower 安装",
            "f": "w"
        },
        {
            "q": "webRoot",
            "m": "如果使用内建的 webapp 模板构建，此参数用于指定 WEBROOT 目录，默认根据 maven 目录结构规范，相对于 -p 路径的 src/main/webapp/",
            "f": "w"
        },
        {
            "q": "viewRoot",
            "m": "如果使用内建的 webapp模板构建，此参数用于指定服务器端视图模板目录，默认根据 maven 目录结构规范，相对于 -p 路径的 src/main/webapp/WEB-INF/views/",
            "f": "w"
        },
        {
            "q": "deployRoot",
            "m": "deploy 文件夹的路径, 相对于 project 参数, 默认放在 project 指定路径的根目录",
            "f": "w"
        },
        {
            "q": "tMockRoot",
            "m": "template mock 数据文件夹的路径, 相对于 project 参数, 默认放在 src/main/webapp/src/mock/",
            "f": "w"
        },
        {
            "q": "iMockRoot",
            "m": "interface mock 数据文件夹的路径, 相对于 project 参数, 默认放在 src/main/webapp/WEB_INF/views/mock/",
            "f": "w"
        },
        "",
        "以下参数对于使用 mobile 模板的项目特有：",
        {
            "j": "l",
            "q": "lang",
            "d": "oc",
            "m": "要导出的语言标识，支持的语言有 oc、java 等",
            "f": "m"  // `for` `mobile` only
        },
        {
            "q": "author",
            "d": "netease",
            "m": "构建者名称",
            "f": "m"
        },
        {
            "q": "reqAbstract",
            "d": "HTBaseRequest",
            "m": "请求基类名称，不带类名的前缀。如果指定语言是 Java，它的默认值为 BaseHttpStringRequestTask",
            "f": "m"
        },
        {
            "q": "modelAbstract",
            "d": "HTHTTPModel",
            "m": "数据模型基类名称，不带类名的前缀",
            "f": "m"
        },
        {
            "q": "resOut",
            "m": "生成的 NEI 资源相对工程的路径，如不指定，Java 工程的值为'app/src/main/hthttp-gen/'，Objective-C 工程的值为'{产品名}+/NetWork/'",
            "f": "m"
        },
        "",
        "以下参数在生成 mobile 项目的 Objective-C 模型和请求文件时特有：",
        {
            "q": "namePrefix",
            "d": "HT",
            "m": "生成的文件名、类名的前缀，默认为 HT",
            "f": "mo" // `for` `mobile` `objective-c` only
        },
        {
            "q": "reqHeaders",
            "d": "Requests",
            "m": "包含所有数据请求的头文件名称，不带类名的前缀",
            "f": "mo"
        },
        {
            "q": "modelHeaders",
            "d": "Models",
            "m": "包含所有数据模型的头文件名称，不带类名的前缀",
            "f": "mo"
        },
        {
            "q": "resOnly",
            "m": "更新项目文件时，是否只更新 NEI 上的资源文件",
            "f": "mo"
        },
        "",
        "以下参数在生成 mobile 项目的 Java 模型和请求文件时特有：",
        {
            "q": "appPackage",
            "d": "com.netease",
            "m": "应用的包名",
            "f": "mj" // `for` `mobile` `java` only
        },
        {
            "q": "modelPackage",
            "d": "hthttp.model",
            "m": "模型的相对包名",
            "f": "mj"
        },
        {
            "q": "reqPackage",
            "d": "hthttp.httptask",
            "m": "http请求的相对包名",
            "f": "mj"
        }
    ],
    "update": [
        "使用说明：",
        "nei update [IDS] [参数]",
        "",
        "[IDS]\t\t\tNEI平台中对应的项目ID，多个项目ID用逗号分隔，不传则表示更新所有已生成的项目",
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
            "m": "是否覆盖已存在的 MOCK 数据文件，默认不覆盖"
        },
        {
            "q": "tag",
            "m": "只更新含有指定 tag 的模板, 默认全部更新"
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
    ]
};