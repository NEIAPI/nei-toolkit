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
        "nei build -k [key]",
        "",
        "<key>\t\t\tNEI 平台中项目的唯一 key, 可以在工具设置中查看",
        "",
        "参数说明：",
        "%p",
        "",
        "使用举例：",
        "nei build -k xyz"
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
            "m": "工程规范类型, 支持 web、aos、ios、test 四种类型"
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
            "j": "w",
            "q": "overwrite",
            "d": false,
            "m": "是否覆盖已存在的文件"
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
            "j": "cf",
            "q": "configFile",
            "d": "",
            "m": "本地服务器配置文件路径"
        }
    ]
};