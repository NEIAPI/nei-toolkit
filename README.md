# 工具简介

本工具提供了 NEI 平台配套的自动化功能，本工具的主要特性有：

* 支持根据 [NEI 平台](http://nei.hz.netease.com/) 定义的工程规范, 生成工程的初始化目录结构
* 集成了本地模拟容器

# 工具使用

## 环境配置
构建工具基于 [Node.js](http://nodejs.org/) 平台，因此需要先安装 Node.js 环境，Node.js 在各平台上的安装配置请参阅官方说明。

>安装的 Node.js 版本须为 v4.2 及以上

## 安装

```bash
npm install "NEYouFan/nei-toolkit#dev" –g
```

# 指令说明

本工具使用时在终端或者命令行输入以下格式指令运行

```bash
nei [指令] [参数]
```

其中可用的指令包括：

| 指令  | 描述 |
| :--- | :--- |
| build  | 根据在 NEI 平台上定义的工程规范, 生成工程的初始化目录结构 |
| update | 更新通过 `nei build` 构建的项目 |
| server | 启动本地模拟容器 |

其中针对 nei 可用的参数包括：

| 简写 | 全称 | 描述 |
| :--- | :--- | :--- |
| -v | --version | 显示工具版本信息 |
| -h | --help    | 显示指定命令的帮助信息 |

使用范例：

查看工具版本信息：

```bash
nei -v
```

显示工具帮助信息：

```bash
nei -h
```

查看 build 指令帮助信息：

```bash
nei build -h
```

## build

根据在 NEI 平台上定义的工程规范, 生成工程的初始化目录结构，指令的运行格式为：

```bash
nei build -k [key]
``` 

其中 [key] 是 NEI 平台上的项目的唯一标识, 可以在项目的"工具(设置)"中查看, 如图所示:

其中 [IDS] 表示用户在 NEI 平台上定义的项目 id，必须输入，多个 id 用逗号或者分号分隔，项目的 id 可以通过 NEI 平台的访问地址栏的 pid 取到，如下图所示

![查看NEI平台ID信息](./doc/res/pid.png)

>针对 `nei build` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help |  | 显示 build 命令的帮助信息 |
| -o | --output | ./ | 指定项目的输出目录 |
| -k | --key |  | 项目的唯一标识, 可以在项目的"工具(设置)"中查看 |
| -w | --overwrite | false | 是否覆盖已存在的文件 |
| -st | --specType | web | 要构建的规范类型, 目前支持 web、aos、ios、test 四种类型 |

使用范例：

在当前目录下构建 key 为 xyz 的项目：

```bash
nei build -k xyz
```

## update

更新通过 `nei build` 构建的项目，指令的运行格式为：

```bash
nei update [-k] [key]
``` 

其中 [key] 是 NEI 平台上的项目的唯一标识, 可以在项目的"工具(设置)"中查看

可以不传 key, 此时更新指定目录下的项目

针对 `nei update` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help  | | 显示 update 命令的帮助信息 |
| -o | --output | ./ | 指定的项目目录 |
| -w | --overwrite | false | 是否覆盖已存在的文件 |

使用范例：

更新当前目录下通过 `nei build` 生成的项目

```bash
nei update
```

>注意, 如果在 build 的时候指定了项目目录, 则需要先进入该目录再运行 `nei update` 命令, 或者也可以通过下面的命令来更新.

更新指定目录 ./mypro 下的项目

```bash
nei update -o ./mypro
```

>提示: 可以先在本地创建项目目录, 然后在该目录下使用 `nei build` 和 `nei update` 命令, 使用默认值即可.


## server
启动内置的本地模拟容器

```bash
nei server [ID] [参数]
```

其中 [ID] 是 NEI 平台中对应的项目 id

>针对 `nei server` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help | | 显示 mobile 命令帮助信息 |
| -o | --output | | 已构建项目的输出路径 |
| -cf | --configFile | | 本地服务器配置文件路径 |

使用范例

启动目录为 ./mypro 下的项目:

```bash
nei server -o ./mypro
```

> OS X 下如果有异常请使用 `sudo nei server` 命令启动


