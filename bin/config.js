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
            "j": "o",
            "q": "output",
            "d": "./",
            "m": "指定工程输出目录, 默认为当前目录"
        },
        {
            "q": "key",
            "d": "",
            "m": "项目的唯一标识"
        },
        {
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的文件"
        },
        {
            "q": "specType",
            "d": "web",
            "m": "工程规范类型"
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
            "m": "是否需要更新页面的模板文件和相应的 js 和 css 模块代码",
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
            "m": "构建者名称"
        },
        "",
        "以下参数在生成 Objective-C 模型和请求文件时有效：",
        {
            "q": "reqAbstract",
            "d": "HTBaseRequest",
            "m": "请求基类名称，不带类名的前缀",
            "f": "oc" // `for` `lang` `objective-c` only
        },
        {
            "q": "modelAbstract",
            "d": "HTHTTPModel",
            "m": "数据模型基类名称，不带类名的前缀",
            "f": "oc"
        },
        {
            "q": "namePrefix",
            "d": null,
            "m": "生成的文件名、类名的前缀，必需",
            "f": "oc"
        },
        {
            "q": "reqHeaders",
            "d": "Requests",
            "m": "包含所有数据请求的头文件名称，不带类名的前缀",
            "f": "oc"
        },
        {
            "q": "modelHeaders",
            "d": "Models",
            "m": "包含所有数据模型的头文件名称，不带类名的前缀",
            "f": "oc"
        },
        {
            "q": "resOut",
            "d": "./",
            "m": "生成的 NEI 资源相对工程的路径",
            "f": "oc"
        },
        {
            "j": "f",
            "q": "force",
            "d": false,
            "m": "在生成资源文件时，是否强制更新 .pbxproj 工程文件",
            "f": "oc"
        },
        "",
        "以下参数在生成 Java 模型和请求文件时有效：",
        {
            "q": "reqAbstract",
            "d": null,
            "m": "请求的基类，格式为全路径。若值为 null，则不用生成请求文件",
            "f": "java" // `for` `lang` `java` only
        },
        ///
        "以下参数在生成 Java 模型和请求文件时有效：",
        {
            "q": "baseModelAbstract",
            "d": null,
            "m": "请求的基类，格式为全路径。若值为 null，则不用生成请求文件",
            "f": "java" // `for` `lang` `java` only
        },
        {
            "q": "appPackage",
            "d": "com.netease",
            "m": "应用的包名",
            "f": "java"
        },
        {
            "q": "modelPackage",
            "d": "hthttp.model",
            "m": "模型的相对包名",
            "f": "java"
        },
        {
            "q": "reqPackage",
            "d": "hthttp.request",
            "m": "http请求的相对包名",
            "f": "java"
        },
        {
            "q": "resOut",
            "d": "app/src/main/hthttp-gen/",
            "m": "生成的 NEI 资源相对工程的路径",
            "f": "java"
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
        },
        {
            "j": "cf",
            "q": "configFile",
            "d": "",
            "m": "配置文件路径"
        }
    ]
};