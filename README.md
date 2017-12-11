# 由来

> 为了能够让`nei-toolkit`在前后端分离实战中起到的作用更加贴切、更加符合实际使用场景。该分支的基本策略就是修复原有功能的缺陷以及渐进增强功能特点。

注: 此分支`edu-fmpp`是以分支`fmpp`为基础进行完善和定制的. 如有需要可访问原有[仓库地址](https://github.com/NEYouFan/nei-toolkit)

### 特点

> 通过命令行或者命令行交互的形式替换频繁修改`server.config.js`的机制.

* `build|server`命令开放`--port`、`--reload`、`--launch`等命令参数配置，具体使用可查看下面文档
* `server`命令新增`--launch`、`--proxy-model`、`--proxy-routes`、`--user-agent`、`--mode-on`等命令参数配置，具体使用可查看下面文档

### 安装

```bash
npm install "techbirds/nei-toolkit#edu-fmpp" -g
```

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
| template | 使用本地数据解析模板 |


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
| -r | --reload |  | 是否监听静态文件和模板文件的变化并自动刷新浏览器,默认是监听的. |
| -l | --launch |  | 是否自动打开浏览器,默认是启动的. |
| -p | --port |  | 端口,默认为8002 |
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
| -n | --name |  | 应用名称,默认app |
| -r | --reload |  | 是否监听静态文件和模板文件的变化并自动刷新浏览器,默认是监听的. |
| -l | --launch |  | 是否自动打开浏览器,默认是启动的. |
| -p | --port |  | 端口,默认为8002 |
| -mo | --mode-on |  | 是否启用开发模式选择,默认关闭的 |
| -pm | --proxy-model |  | 是否启用远程代理模型数据,默认打开 |
| -pr | --proxy-routes |  | 是否启用远程代理异步接口数据,默认打开 |
| -ua | --user-agent |  | 客户端标识,默认为值pc,此外还可以取值为mobile. |


使用范例

启动目录为 ./demo 下的项目:

```bash
nei server  -o mock/demo -r false -l false -pm false -p 8002 -pr true  -ua pc -name demo -mo
```

> OS X 下如果有异常请使用 `sudo nei server` 命令启动

效果示例

![path](./doc/res/server.gif)


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


### template
使用本地数据解析模板。通过指定本地模板文件以及数据文件，能够将模板解析得到输出文件。目前支持的模板语言为[handlebars](http://handlebarsjs.com/)。

```bash
nei template [参数]
```

`nei template` 指令可用的参数包括:

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help | | 显示 template 命令帮助信息 |
| -o | --output | ./ | 输出路径 |
| -p | --path |  | 本地模板路径，必须指定 |
| -d | --data |  | 数据json文件路径,可选 |
| -b | --handlebars |  | 自定义handlebars辅助函数文件路径,可选 |
| -w | --overwrite | false | 是否覆盖已存在的文件 |

用户可以指定数据文件，如`data.json`的文件内容如下:
```json
{
  "project":{
    "name" : "test",
    "version" : "0.0.1"
  },
  "author":{
    "Netease"
  }
}
```
然后用户就可以在模板文件中访问到数据中的数据，如`{{project.name}}`就能够解析为`test`。用户同样可以指定本地handlebars辅助文件，如果用户有多个辅助函数，需要将这些都写到一个文件中，自定义辅助函数的写法与上文一致，参照[此链接](https://github.com/NEYouFan/nei-toolkit/blob/master/doc/Handlebars%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0%E9%9B%86.md#如何撰写自定义handlebars辅助函数)相同。 另外用户也可以不通过指定数据json文件来传入数据，可以通过命令行直接传入数据参数，如：
```bash
nei template -ProductName Test -Prefix HT [其他参数]
```
ProductName和Prefix这两个参数就会作为数据传入到模板中，其等同于
```json
{
  "args":{
    "ProductName" : "Test",
    "Prefix":  "HT"
  }
}
```
如果同时指定了数据文件，将会执行merge操作，其中命令行参数指定的方式优先于数据json文件方式。
### 设置输出信息级别
共设有"all"、"debug"、"info"、"warn"、"error"、"off"等日志级别，级别顺序由大到小，通过`--logLevel`指定一个级别之后，比该级别小的日志级别信息都将会显示出来，比如：
```bash
nei build -k xxxxxxxx --logLevel info
```
那么所有info以下级别(即warn、error)级别的信息都将会显示出来。当指定为off的时候，所有日志信息都将关闭。

## 感谢

* [NEI](https://nei.netease.com)
* [NEI-Toolkit](https://github.com/NEYouFan/nei-toolkit)

## 联系

此分支目前由`hzwangdong5@corp.netease.com`维护，有任何问题可以popo他.


