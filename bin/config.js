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
        "nei build (-pk|-sk) [key] ",
        "",
        "<key>\t\t\tNEI 平台中项目的唯一 key",
        "",
        "参数说明：\t-pk 表示构建项目，其key在项目的工具设置中可以查到",
        "        \t-sk 表示构建规范，其key在规范的规范设置中可以查到",
        "%p",
        "",
        "使用举例：",
        "nei build -pk xyz",
        "nei build -sk zyx"
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
            "j": "k",
            "q": "key",
            "d": "",
            "m": "指定工程唯一标识"
        },
        {
            "j": "sk",
            "q": "specKey",
            "d": "",
            "m": "指定规范唯一标识"
        },
        {
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的文件, 需要下载的文件不在此列, 如果需要重新下载, 请先将本地的文件删除"
        },
        {
            "q": "specType",
            "d": "web",
            "m": "工程规范类型, 支持 web、aos、ios、test 四种类型"
        },
        {
            "q": "iosProjectPath",
            "d": "",
            "m": "iOS工程使用，指定iOS工程路径"
        }
    ],
    "update": [
        "使用说明：",
        "nei update [-k] [key]",
        "",
        "[key]\t\t\tNEI 平台中项目的唯一 key, 可以在工具设置中或者项目目录中的 nei.json 文件中查看",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei update -k xyz",
        "nei update"
    ],
    "update-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示 update 命令帮助信息"
        },
        {
            "j": "o",
            "q": "output",
            "d": "./",
            "m": "指定项目目录，默认为当前目录"
        },
        {
            "j": "k",
            "q": "key",
            "d": "",
            "m": "需要更新的项目的唯一标识"
        },
        {
            "j": "a",
            "q": "all",
            "d": false,
            "m": "是否更新指定目录下面的所有项目，前提是没有指定的 key"
        },
        {
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的文件, 需要下载的文件不在此列, 如果需要重新下载, 请先将本地的文件删除"
        },
        {
            "q": "spec",
            "d": false,
            "m": "是否更新规范中的普通文件和文件夹, 以数据填充的文件不在此列"
        }
    ],
    "server": [
        "使用说明：",
        "nei server [参数]",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei server -o ./webapp"
    ],
    "server-params": [
        {
            "j": "h",
            "q": "help",
            "m": "显示 server 命令帮助信息"
        },
        {
            "j": "o",
            "q": "output",
            "d": "./",
            "m": "已构建项目的根路径"
        },
        {
            "j": "k",
            "q": "key",
            "d": "",
            "m": "需要启动的项目的唯一标识"
        }
    ]
};