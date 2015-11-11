# 工具简介

本工具提供了[NEI平台](http://nei.hz.netease.com/)配套的自动化功能，本工具的主要特性有：

* 支持根据[NEI平台](http://nei.hz.netease.com/)定制生成项目初始结构及代码
* 支持[本地容器PUER](https://github.com/leeluolee/puer)运行配置自动生成
* 支持[NEJ发布工具](https://github.com/genify/toolkit2)配置文件自动生成
* 支持[Fiddler](http://www.telerik.com/fiddler)工具代理本地模拟数据，接口配置文件导出
* 支持[POSTMAN](https://www.getpostman.com/)工具接口配置文件导出
* 支持自动导出模拟数据

# 工具使用

## 环境配置
构建工具基于[nodejs](http://nodejs.org/)平台，因此需要使用者先安装nodejs环境，[nodejs](http://nodejs.org/)在各平台下的安装配置请参阅官方说明。

## 使用说明

1.  执行以下命令安装构建工具，如果已安装构建工具可忽略此步骤

    ```bash
    npm install nei –g
    ```

    如果已安装过构建工具，则可以使用以下命令更新构建工具至最新版本

    ```bash
    npm update nei –g
    ```

2. 执行以下指令根据NEI平台定义的项目ID，构建项目目录结构、模拟容器配置、模拟数据及数据过滤器

	```bash
	nei build 10680
	```

3. 如果之前已经在当前目录下构建过项目，则可以使用以下指令更新项目

	```bash
	nei update
	```

4. 如果只需要导出NEI平台定义的模拟数据，则可以使用以下指令

	```bash
	nei mock 10680
	```

5. 如果只需要导出NEI平台定义的接口的postman工具的配置文件，则可以使用以下指令

	```bash
	nei export 10680
	```

# 指令说明

本工具使用时在终端或者命令行输入以下格式指令运行

```bash
nei [指令] [参数]
```

其中可用的指令包括：

| 指令  | 描述 |
| :--- | :--- |
| build  | 根据NEI平台信息构建项目结构 |
| update | 更新通过 'nei build' 构建的项目 |
| export | 导出第三方工具的配置文件 |
| mock   | 根据NEI平台信息生成测试数据 |

其中针对nei可用的参数包括：

| 简写 | 全称 | 描述 |
| :--- | :--- | :--- |
| -v | --version | 显示工具版本信息 |
| -h | --help    | 显示指定命令的帮助信息 |

使用范例：

查看工具版本信息

```bash
nei -v
```

显示工具帮助信息

```bash
nei -h
```

查看build指令帮助信息

```bash
nei build -h
```

## build

根据NEI平台信息构建项目结构，指令的运行格式为：

```bash
nei build <IDS> [参数]
``` 

其中<IDS>表示用户在NEI平台上定义的项目，必须输入，多个ID用逗号或者分号分隔，项目的ID可以通过NEI平台的访问地址栏的pid取到，如下图所示

![查看NEI平台ID信息](./doc/res/pid.png)

针对nei build指令可用的参数包括：

| 简写 | 全称 | 描述 |
| :--- | :--- | :--- |
| -h | --help    | 显示指定命令的帮助信息 |
| -p | --project | 指定项目目录，默认为当前目录 |
| -t | --template | 指定用于构建的模板实现文件，默认使用内建的webapp模板构建 |
| -w | --overwrite | 是否覆盖已存在的MOCK数据文件，默认不覆盖 |
| 无 | --engine | 如果使用内建的webapp模板构建，此参数用于指定使用的模板引擎，支持内建模板引擎：freemarker、velocity、其他nodejs模板引擎，默认为freemarker引擎 |
| 无 | --webRoot | 如果使用内建的webapp模板构建，此参数用于指定WEBROOT目录，默认根据maven目录结构规范，相对于 -p 路径的 src/main/webapp/ |
| 无 | --viewRoot | 如果使用内建的webapp模板构建，此参数用于指定服务器端视图模板目录，默认根据maven目录结构规范，相对于 -p 路径的 src/main/webapp/WEB-INF/views/ |

使用范例：

在当前目录下构建两个项目（id为23456798和452178），并强行覆盖本地模拟数据文件

```bash
nei build 23456798,452178 -w
```

在指定的目录/path/to/project/下生成id为23456798的项目结构

```bash
nei build 23456798 -p /path/to/project/
```

## update

更新通过 'nei build' 构建的项目，指令的运行格式为：

```bash
nei update [IDS] [参数]
``` 

其中[IDS]表示NEI平台中对应的项目ID，多个项目ID用逗号分隔，不传则表示更新所有已通过“nei build”生成的项目

针对nei update指令可用的参数包括：

| 简写 | 全称 | 描述 |
| :--- | :--- | :--- |
| -h | --help    | 显示指定命令的帮助信息 |
| -p | --project | 指定项目目录，默认为当前目录 |
| -w | --overwrite | 是否覆盖已存在的MOCK数据文件，默认不覆盖 |

使用范例：

更新当前目录下所有通过“nei build”生成的项目

```bash
nei update
``` 

更新指定目录/path/to/project/下ID为1245687的项目

```bash
nei update 1245687 -p /path/to/project/
```

## mock

根据NEI平台信息生成测试数据，指令的运行格式为：

```bash
nei mock <ID> [参数]
```

其中<ID>为NEI平台中对应的项目ID，必须输入

针对nei mock指令可用的参数包括：

| 简写 | 全称 | 描述 |
| :--- | :--- | :--- |
| -h | --help    | 显示指定命令的帮助信息 |
| -o | --output | 指定输出目录，默认为当前目录 |
| -w | --overwrite | 是否覆盖已存在的MOCK数据文件，默认不覆盖 |
| -t | --type | 要导出的数据类型，0：模板+接口，1：模板，2：接口，默认为0 |
| -f | --fiddler | 如果type是0或者2的情况可以用此参数配置是否导出fiddler配置文件，默认不导出 |

使用范例：

在当前目录下生成项目106764的模版和接口的模拟数据

```bash
nei mock 106764
```

在指定目录/path/to/output/下生成接口的模拟数据和Fiddler工具的配置文件

```bash
nei mock 233454 -t 2 -o /path/to/output/
```

导出的fiddler配置文件可以通过以下方式导入[Fiddler](http://www.telerik.com/fiddler)工具

![Fiddler导入配置](./doc/res/fiddler.png)

## export

导出第三方工具的配置文件，指令的运行格式为：

```bash
nei export <IDS> [参数]
```

其中<IDS>表示NEI平台中对应的项目ID，多个项目ID用逗号分隔，必须输入

针对nei export指令可用的参数包括：

| 简写 | 全称 | 描述 |
| :--- | :--- | :--- |
| -h | --help    | 显示指定命令的帮助信息 |
| -d | --domain  | 指定服务器的域名、端口，默认为localhost |
| -o | --output  | 指定输出目录，默认为当前目录 |
| -w | --overwrite | 是否覆盖已存在的配置文件，默认不覆盖 |
| -t | --type    | 要导出的配置文件类型，后续扩展，0：POSTMAN，默认为0 |

使用范例：

在当前目录下导出项目2345,6798的postman工具接口配置文件

```bash
nei export 2345,6798
```

在/path/to/output/目录下导出项目23456798的postman工具接口配置文件

```bash
nei export 23456798 -d https://10.256.7.23:8080 -o /path/to/output/
```

导出的postman配置文件可以通过以下方式导入[POSTMAN](https://www.getpostman.com/)工具

![POSTMAN导入配置](./doc/res/postman.png)

# 版本历史

# 0.1.9   (2015-11-11)

* 修正模板中NEJ路径错误

# 0.1.7   (2015-11-05)

* 输出release.conf文件名带NEI ID
* 修正循环引用识别异常

# 0.1.6   (2015-10-23)

* 更新时不重新构建WEBAPP目录
* 更新release.conf模板
* 修正postman导出没有updateTime异常

# 0.1.5   (2015-10-17)

* 修正GET请求postman配置文件错误
* 支持模拟数据动态更新

# 0.1.4   (2015-10-16)

* 更新release.conf模板
* 调整util.js模板中使用的模板路径用puer.js的配置
* 调整DIR_SOURCE_TP,DIR_OUTPUT_TP路径的输出格式
* 重写参数解析规则，简写采用配置形式
* 支持export指令，默认导出POSTMAN配置文件
* NEI平台数据导出接口兼容性调整
* 增加离线配置

# 0.1.2   (2015-08-29)

* 修正NEI获取数据结果的错误
* 更新release.conf模板文件
* 更新mcss默认配置

# 0.1.1   (2015-08-25)

* 修正页面入口模板错误
* 修正puer路由配置异常
* 修正数组循环引用错误

# 0.1.0   (2015-08-22)

* 调整webapp系统默认模板输出路径
* update时不再重新生成release.conf文件
* 修正请求method异常
* 本地容器配置输出先check文件是否存在

# 0.0.8   (2015-08-20)

* 增加mock指令单独导出模拟数据
* 增加fiddler配置支持配置文件导出

# 0.0.7   (2015-08-19)

* 支持多个NEI项目build在相同目录下
* 修正配置文件异常
* 服务器启动脚本增加mcss启动

# 0.0.4   (2015-08-18)

* 修正容器配置文件生成模板
* 增加模板引擎输入支持
* 增加mcss代码
* 重置容器配置信息
* 修改容器路由生成异常

# 0.0.1

* 初始版本

