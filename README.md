# 工具简介

本工具是[NEI 接口管理平台](https://nei.netease.com/)自动化构建工具，主要功能有：

* 根据 NEI 平台定义的工程规范，生成工程的初始化目录结构
* 自动集成在 NEI 上定义的资源: 页面、异步接口、数据模型、页面模板、业务分组等
* 本地模拟容器

## NEI 工程规范介绍

* [NEI 工程规范介绍](./doc/工程规范介绍.md)
* [传给模板的数据格式说明](./doc/传给模板的数据格式说明.md)(**重要，必读**)
* [Handlebars](http://handlebarsjs.com/) 是本工具渲染文件内容所使用的模板引擎
* [Handlebars 辅助函数集说明](./doc/Handlebars辅助函数集.md)

## 教程
* [NEI 基本概念介绍](./doc/NEI基本概念介绍.md)
* [使用 NEI 进行前后端并行开发](./doc/使用NEI进行前后端并行开发.md)
* [老项目迁移到 NEI 上的说明](./doc/老项目的迁移说明.md)
* [一步一步教你如何愉快地生成 JavaBean 文件](./doc/一步一步教你如何愉快地生成JavaBean文件.md)
* [JavaBean 文件的示例模板](./doc/JavaBean文件的示例模板.md)
* [NEI 平台规则函数使用说明](./doc/NEI平台规则函数使用说明.md)
* [NEI 平台系统预置的规则函数集](./doc/NEI平台系统预置的规则函数集.md)

## 工具使用

### 环境配置
构建工具基于 [Node.js](http://nodejs.org/) 平台，因此需要先安装 Node.js 环境，Node.js 在各平台上的安装配置请参阅官方说明。

>安装的 Node.js 版本须为 v4.2 及以上

### 安装

```bash
npm install nei –g
```

>提示1: 如果安装不成功, 可以尝试命令 `npm install -g nei`

>提示2: 如果已经安装过 nei, 请使用更新命令 `npm update nei -g`

## 指令说明

本工具使用时在终端或者命令行输入以下格式指令运行

```bash
nei [指令] [参数]
```

其中可用的指令包括：

| 指令  | 描述 |
| :--- | :--- |
| build  | 根据在 NEI 平台上定义的工程规范，生成工程的初始化目录结构 |
| update | 更新通过 `nei build` 构建的项目 |
| server | 启动本地模拟容器 |


### build
根据在 NEI 平台上定义的工程规范，生成工程的初始化目录结构，指令的运行格式为：

```bash
nei build -k [key] [参数]
``` 

其中 [key] 是 NEI 平台上的项目的唯一标识，可以在项目的"工具(设置)"中查看

针对 `nei build` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help |  | 显示 build 命令的帮助信息 |
| -o | --output | ./ | 指定项目的输出目录 |
| -k | --key |  | 项目的唯一标识，可以在项目的"工具(设置)"中查看 |
| -sk| --specKey |  | 规范的唯一标识，可以在规范的"规范设置"中查看 |
| -w | --overwrite | false | 是否覆盖已存在的文件，需要下载的文件不在此列，如果需要重新下载，请先将本地的文件删除 |
| 无 | --specType | web | 要构建的规范类型，目前支持 web、aos、ios、test 四种类型 |

使用范例：

在当前目录下构建 key 为 xyz 的项目：

```bash
nei build -k xyz
```

规范也可以独立于项目生成脚手架文件, 在当前目录下构建 key 为 xyz 的规范：

```bash
nei build -sk xyz
```

>注意: 如果 k 和 sk 参数同时存在, 系统会优先考虑 sk 参数

### update

更新通过 `nei build` 构建的项目，指令的运行格式为：

```bash
nei update [参数]
``` 

`nei update` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help  | | 显示 update 命令的帮助信息 |
| -o | --output | ./ | 指定的项目目录 |
| -k | --key |  | 需要更新的项目的唯一标识 |
| -a | --all | false | 是否更新指定目录下面的所有项目，前提是没有指定的 key |
| -w | --overwrite | false | 是否覆盖已存在的文件，需要下载的文件不在此列，如果需要重新下载，请先将本地的文件删除 |
| 无 | --spec | false | 是否更新规范中的普通文件和文件夹，以数据填充的文件不在此列 |

使用范例：

更新当前目录下通过 `nei build` 生成的项目

```bash
nei update
```

>提示: 可以先在本地创建项目目录，然后在该目录下使用 `nei build` 和 `nei update` 命令，使用默认值即可.


### server
启动内置的本地模拟容器

```bash
nei server [参数]
```

`nei server` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help | | 显示 server 命令帮助信息 |
| -o | --output | ./ | 已构建项目的输出路径 |
| -k | --key |  | 需要启动的项目的唯一标识 |

使用范例

启动目录为 ./mypro 下的项目:

```bash
nei server -o ./mypro
```

> OS X 下如果有异常请使用 `sudo nei server` 命令启动

## 版本更新说明
[更新说明](./CHANGELOG)

## Licence
[MIT](./LICENSE)

## 感谢
感谢[网易云](http://www.163yun.com/)提供的云服务, 目前 [NEI](https://nei.netease.com) 已经托管在网易云上。

## 讨论组:

NEI 用户交流 QQ 群(453281988):

![QQ 群](./doc/res/nei_qq.jpeg)

NEI 用户交流微信群:

![QQ 群](./doc/res/nei_wechat.jpeg)



