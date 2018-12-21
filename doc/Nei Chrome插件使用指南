## Nei Chrome插件
#### 背景
前端工程师在开发页面的时候，经常会碰到一个很实际的问题: 在后端接口还没开发完成时，前端怎么办?
通常有两种方案：
1. 直接在代码中 mock 相应的数据。这种方案的缺点很明显，会引入无用的代码。
2. 请求转发，利用nginx或者本地server（webpack-serve）将本地开会过程中调用的接口转发到nei线上服务。

方案二看似完美，但是在实际使用过程中有配置成本层面的问题：
1. 接口变更(新增、删除、修改)都需要更新转发路由表的配置文件
2. 接口开始和关闭mock服务，配置比较繁琐，不够直观
3. webpack-serve方式代理，在多人协助时git冲突不可避免

#### 新的方案
基于目前开发阶段前端工程师大多使用chrome调试的现状，将方案二中请求转发的逻辑迁移到浏览器中处理，并提供开启关闭接口mock的交互界面。

**插件初始化阶段**
1. 进入devtools的时候，判断当前域名下面有没有项目
2. 没有的话，新建项目
3. 有的话遍历当前域名下面的项目
4. 获取业务分组和接口 
5. 判断当前项目下paths的有效状态（是否被删除）和选中状态
6. 开启和关闭接口

**页面js运行时**
1. 拦截请求，判断origin !== 'nei.netease.com'并且path命中，两个条件都符合的话做307跳转

#### 使用教程
1. 安装插件
    - 插件地址： [nei-chrome-devtoos](https://chrome.google.com/webstore/detail/nei-chrome-devtools/lhkoddlalkcnmmnjkfjaaohbfeinckjn?hl=zh-CN)
2. 新建项目(ps: 需要先登录，未登录会打开nei登录页面)，输入pid后会先显示该项目下所有的项目分组和接口 
    - 项目ID指的是项目链接中pid参数对应的值 https://nei.netease.com/project?pid=${pid}
    ![](https://p1.music.126.net/8G0u3GzZboJe7iZjeV3mvA==/109951163732240573.png)
    ![](https://p1.music.126.net/0d7LcyOG-hwzoFM8z4vaSg==/109951163732244354.png)
    
3. 业务开发过程中开启和关闭接口mock，日常开发中-"常用接口分组"是使用频率最高的分组，需要注意的地方有2点：
    - 业务分组中开始mock规则的接口会自动添加到常用接口分组中    
    - 常用接口分组删除的接口会自动关闭mock规则
    ![](https://p1.music.126.net/IAQHhaiPnidgoGtGpGYwGA==/109951163732290177.png)

4. demo演示
    - 未开启mock
    ![](https://p1.music.126.net/lGGLmlmByJisOJiebMK7Pw==/109951163732319361.gif)
    - 开启mock
    ![](https://p1.music.126.net/UnuLOZ-BuGkqyKgWiLlfeQ==/109951163732316915.gif)

#### 注意
- 插件数据都存储在localstorage中，清理缓存后部分配置会失效，但是配置相当简单有何所谓呢~
 
#### show me the code
- 代码仓库：[code](https://github.com/amibug/nei-chrome-devtools)
- 提提建议: [Issue](https://github.com/amibug/nei-chrome-devtools/issues)
