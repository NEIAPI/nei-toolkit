# {{projectName}}

#### 代码规范

* 缩进统一使用 4 个空格, 请设置自己的编辑器
* JS 语句最后要加分号
* 文件最开始请写上创建者信息
* 文件名统一使用小写, 中间可以使用下划线分隔

#### 运行项目

* 首先在本地机器上安装 [Node.js 和 NPM](http://nodejs.org/)、[Mcss](https://github.com/leeluolee/mcss)。

>注意，Node.js 的版本须为 `v4.2` 及以上。

* 然后运行下面的命令：

```bash
npm install
```

默认端口号是 `8080`，也可以通过环境变量 `PORT` 指定端口号.

* mcss 文件的监听经常会出现错误，可以使用 gulp 来监听，同时提供 liveload 的功能：

```bash
gulp watch
```

Chrome 浏览器安装 liveload 插件：[安装地址](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei)。安装完后，点击 icon，空心圆变成实心圆后，就说明生效了。
