# 工具简介

本工具提供了 NEI 平台配套的自动化功能，本工具的主要特性有：

* 支持根据 [NEI 平台](http://nei.hz.netease.com/) 定制生成项目初始结构及代码
* 支持 [NEJ 发布工具](https://github.com/genify/toolkit2) 配置文件自动生成
* 支持 [Fiddler](http://www.telerik.com/fiddler) 和 [Charles](https://www.charlesproxy.com/) 工具代理本地模拟数据，接口配置文件导出
* 支持自动生成移动端数据模型、请求类代码
* 支持自动导出模拟数据
* 集成了本地模拟容器

# 工具使用

## 环境配置
构建工具基于 [Node.js](http://nodejs.org/) 平台，因此需要先安装 Node.js 环境，Node.js 在各平台上的安装配置请参阅官方说明。

>安装的 Node.js 版本须为 v4.2 及以上

## 使用说明

1. 执行以下命令安装构建工具，如果已安装构建工具可忽略此步骤

    ```bash
    npm install nei –g
    ```

    如果已安装过构建工具，则可以使用以下命令更新构建工具至最新版本

    ```bash
    npm update nei –g
    ```

2. 执行以下指令根据 NEI 平台定义的项目 id，构建项目目录结构、模拟容器配置、模拟数据及数据过滤器

	```bash
	nei build 10680
	```

3. 如果之前已经在当前目录下构建过项目，则可以使用以下指令更新项目

	```bash
	nei update
	```

4. 如果只需要导出 NEI 平台定义的模拟数据，则可以使用以下指令

	```bash
	nei mock 10680
	```
	
5. 启动本地模拟容器, 运行 web 工程:

	```bash
	nei server
	```
	> OS X 下如果有异常请使用 `sudo nei server` 命令启动

# 指令说明

本工具使用时在终端或者命令行输入以下格式指令运行

```bash
nei [指令] [参数]
```

其中可用的指令包括：

| 指令  | 描述 |
| :--- | :--- |
| build  | 根据 NEI 平台信息构建项目结构 |
| update | 更新通过 `nei build` 构建的项目 |
| export | 已移除, 暂不支持 |
| mock   | 根据 NEI 平台信息生成测试数据 |
| mobile | 根据 NEI 平台信息生成移动平台模型和请求代码 |
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

根据 NEI 平台信息构建项目结构，指令的运行格式为：

```bash
nei build [IDS] [参数]
``` 

其中 [IDS] 表示用户在 NEI 平台上定义的项目 id，必须输入，多个 id 用逗号或者分号分隔，项目的 id 可以通过 NEI 平台的访问地址栏的 pid 取到，如下图所示

![查看NEI平台ID信息](./doc/res/pid.png)

>针对 `nei build` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help |  | 显示 build 命令的帮助信息 |
| -c | --config | | 参数配置文件路径，优先级低于命令行中的参数 |
| -t | --template | webapp | 指定用于构建的模板实现文件. 目前支持 `webapp`, `mobile`, `node` 三种类型 |
| -p | --project | ./ | 指定项目目录，默认为当前目录 |
| -pt| --projectType | hz.netease | 项目类型 |
| -w | --overwrite | false | 是否覆盖已存在的测试数据文件 |
| 无 | --author | netease | 构建者名称 |

>config 参数指定的是一个文件路径, 该文件的内容必须是有效的 json, 比如:

```javascript
{
  "project": "./myproject",
  "tMockRoot": "./mock/template", // 相对于 project 参数的路径
  "iMockRoot": "./mock/interface" // 相对于 project 参数的路径
}
```

>以下参数对于使用 webapp 模板的项目特有：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| 无 | --engine | | 如果使用内建的 webapp 模板构建，此参数用于指定使用的模板引擎，支持内建模板引擎：freemarker、velocity, 默认为 `freemarker` 引擎 |
| 无 | --webRoot | | 如果使用内建的 webapp 模板构建，此参数用于指定 WEBROOT 目录，如果是相对路径，则是相对于 -p 参数指定的路径, 默认是 `src/main/webapp/` |
| 无 | --viewRoot | | 如果使用内建的 webapp 模板构建，此参数用于指定服务器端视图模板目录，如果是相对路径，则是相对于 -p 参数指定的路径, 默认是 `src/main/webapp/WEB-INF/views/` |
| 无 | --deployRoot | | deploy 文件夹的路径, 默认相对于 -p 路径, 放在 -p 指定路径的根目录 |
| 无 | --tMockRoot | | template mock 数据文件夹的路径, 如果是相对路径，则是相对于 -p 参数指定的路径, 默认是 `src/main/webapp/src/mock/` |
| 无 | --iMockRoot | | interface mock 数据文件夹的路径, 如果是相对路径，则是相对于 -p 参数指定的路径, 默认是 `src/main/webapp/WEB_INF/views/mock/` |
| 无 | --mcss | true | 是否需要生成 mcss 代码, 默认是 true |
| 无 | --bower | false | 是否需要安装 bower 依赖, 默认是 false. 注意: windows 下会报权限错误, 请不要使用该选项. |

>以下参数对于使用 mobile 模板的项目特有：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| l | --lang | oc | 要导出的语言标识，支持的语言有 oc、java 等 |
| tp | --templatePath | | 模板路径，默认为空，使用时必须指定 |
| tdp| --templateDataPath | | 模板的数据文件路径，默认为空，文件内容须是有效的 json |

>以下参数在生成 mobile 项目的 Objective-C 模型和请求文件时特有：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| 无 | --reqAbstract | HTBaseRequest | 请求基类名称，不带类名的前缀 |
| 无 | --modelAbstract | HTHTTPModel | 数据模型基类名称，不带类名的前缀 |
| 无 | --namePrefix | HT | 生成的文件名、类名的前缀，默认为 HT |
| 无 | --reqHeaders | Requests | 包含所有数据请求的头文件名称，不带类名的前缀 |
| 无 | --modelHeaders | Models | 包含所有数据模型的头文件名称，不带类名的前缀 |
| 无 | --updateProject | false | 是否将模板文件夹下的文件添加到 Xcode 工程中 |
| 无 | --resOut | {{产品名}}+/NetWork/ | 生成的 NEI 资源相对工程的路径。如果有值，则第一个路径会作为产品名，否则产品名为空 |

>以下参数在生成 mobile 项目的 Java 模型和请求文件时特有： 

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| 无 | --reqAbstract | null | 请求的基类，格式为全路径。若值为 null，则不用生成请求文件 |
| 无 | --appPackage | com.netease | 应用的包名 |
| 无 | --modelPackage | hthttp.model | 模型的相对包名 |
| 无 | --reqPackage | hthttp.httptask | http 请求的相对包名 |
| 无 | --resOut | app/src/main/hthttp-gen/ | 生成的 NEI 资源相对工程的路径 |

>以下参数在生成 Node.js 项目时特有： 

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| 无 | --engine | ejs | 模板引擎，如 EJS、Jade、Handlebars、Hogan.js 等 |
| 无 | --projectName | node_project | 项目名称, 请使用小写 |
| 无 | --mcss | true | 是否使用 mcss |
| 无 | --npm | false | 是否需要自动安装 npm 依赖 |
| 无 | --bower | false | 是否需要自动安装 nej 和 Regularjs 的 Bower 依赖 |

使用范例：

在当前目录下构建两个项目（id 为 23456798 和 452178），并强行覆盖本地模拟数据文件：

```bash
nei build 23456798,452178 -w
```

在指定的目录 /path/to/project/ 下生成 id 为 23456798 的项目结构：

```bash
nei build 23456798 -p /path/to/project/
```

## update

更新通过 `nei build` 构建的项目，指令的运行格式为：

```bash
nei update [IDS] [参数]
``` 

其中 [IDS] 表示 NEI 平台中对应的项目 id，多个项目 id 用逗号分隔，不传则表示更新所有已通过 `nei build` 生成的项目

针对 `nei update` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help  | | 显示 update 命令的帮助信息 |
| -p | --project | ./ | 指定项目目录，默认为当前目录 |
| -w | --overwrite | false | 是否覆盖已存在的测试数据文件，默认不覆盖 |
| 无 | --tag | | 只更新含有指定 tag 的模板, 默认全部更新 |
| 无 | --view | true | 是否需要更新页面的模板文件和相应的 js 模块代码 |

使用范例：

更新当前目录下所有通过 `nei build` 生成的项目

```bash
nei update
```

>注意, 如果在 build 的时候指定了项目目录, 则需要先进入该目录再运行 `nei update` 命令, 或者也可以通过下面的命令来更新.

更新指定目录 /path/to/project/ 下 id 为 1245687 的项目

```bash
nei update 1245687 -p /path/to/project/
```

>提示: 可以先在本地创建项目目录, 然后在该目录下使用 `nei build` 和 `nei update` 命令, 使用默认值即可.

## mock

根据 NEI 平台信息生成测试数据，指令的运行格式为：

```bash
nei mock [ID] [参数]
```

其中 [ID] 为 NEI 平台中对应的项目 id，必须输入

针对 `nei mock` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help | | 显示 mock 命令的帮助信息 |
| -o | --output | ./ | 指定输出目录，默认为当前目录 |
| -w | --overwrite | false | 是否覆盖已存在的 MOCK 数据文件，默认不覆盖 |
| -t | --type | 0 | 要导出的数据类型，0：模板+接口，1：模板，2：接口，默认为 0 |
| -f | --fiddler | false | 如果 type 是 0 或者 2 的情况可以用此参数配置是否导出 fiddler 配置文件，默认不导出 |
| -c | --charles | false | 如果 type 是 0 或者 2 的情况可以用此参数配置是否导出 charles 配置文件，默认不导出 |

使用范例：

在当前目录下生成项目 106764 的模版和接口的模拟数据

```bash
nei mock 106764
```

在指定目录 /path/to/output/ 下生成接口的模拟数据和 Fiddler 工具的配置文件

```bash
nei mock 233454 -t 2 -o /path/to/output/
```

导出的 fiddler 配置文件可以通过以下方式导入 [Fiddler](http://www.telerik.com/fiddler) 工具

![Fiddler导入配置](./doc/res/fiddler.png)

导出的 Charles 配置文件可以通过以下方式导入 [Charles](https://www.charlesproxy.com/) 工具:

选择 Tools --> Map Local...

![Charles导入配置](./doc/res/charles.png)

## mobile

自动生成移动平台数据模型和请求类代码

```bash
nei mobile [ID] [参数]
```

其中 [ID] 是 NEI 平台中对应的项目 id，必须输入

>针对 `nei mobile` 指令可用的参数包括：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| -h | --help | | 显示 mobile 命令帮助信息 |
| -c | --config | | 参数配置文件路径，优先级低于命令行中的参数 |
| -o | --output | ./ | 指定输出目录，默认为当前目录 |
| -l | --lang | oc | 要导出的语言标识，支持的语言有 oc 和 java |
| 无 | --author | netease | 构建者名称 |

>以下参数在生成 Objective-C 模型和请求文件时特有：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| 无 | --reqAbstract | HTBaseRequest | 请求基类名称，不带类名的前缀 |
| 无 | --modelAbstract | HTHTTPModel | 数据模型基类名称，不带类名的前缀 |
| 无 | --namePrefix | HT | 生成的文件名、类名的前缀，默认为 HT |
| 无 | --reqHeaders | Requests | 包含所有数据请求的头文件名称，不带类名的前缀 |
| 无 | --modelHeaders | Models | 包含所有数据模型的头文件名称，不带类名的前缀 |
| -f | --force | false | 是否强制更新 OC 工程的 .pbxproj 文件 |
| 无 | --resOut | ./ | 生成的 NEI 资源相对工程的路径 |

>以下参数在生成 Java 模型和请求文件时特有：

| 简写 | 全称 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| 无 | --reqAbstract | null | 请求的基类，格式为全路径。若值为 null，则不用生成请求文件 |
| 无 | --appPackage | com.netease | 应用的包名 |
| 无 | --modelPackage | hthttp.model | 模型的相对包名 |
| 无 | --reqPackage | hthttp.httptask | http 请求的相对包名 |
| 无 | --resOut | app/src/main/hthttp-gen/ | 生成的 NEI 资源相对工程的路径 |
| 无 | --doNotOverwrite | false | 接口更新时,是否覆盖原来的request文件 |

使用范例

在当前目录下导出项目 2345 的 Objective-C 语言的数据模型和请求对象：

```bash
nei mobile 2345
```

在 /path/to/output/ 下导出项目 23456798 的 Java 语言的数据模型和请求对象：

```bash
nei mobile 23456798 -l java -o /path/to/output/
```

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
| -p | --path | | 项目的根路径 |
| -cf | --configFile | | 配置文件的路径, 优先级大于 -p |

使用范例

假设使用 `build` 命令生成的工程根路径是 webapp, 项目 id 是 12345, 则可以使用下面的任一命令启动模拟容器:

* 指定工程目录, 此时会查找该目录下第一个类似 nei.xxxx 目录下面的 jtr.js 文件:

```bash
nei server -p ./webapp
```

* 指定项目 id: , 此时会查找当前目录(如果没有指定 -p 参数)下名为 nei.[id] 目录下面的 jtr.js 文件:

```bash
nei server 12345
```

* 指定配置文件路径, 此时忽略 -p 和 id 参数:

```bash
nei server -cf ./webapp/nei.12345/jtr.js
```

> OS X 下如果有异常请使用 `sudo nei server` 命令启动


