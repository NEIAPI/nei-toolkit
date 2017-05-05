# 1. 安装

## 1.1 安装插件

点击 `Android Studio`，选择`Preference`->`Plugins`，然后选择`install from disk`，安装本目录下的`ht-as-nei-plugin.jar`。或者直接在插件库中搜索`NeiPlugin`，点击安装，接着重启更新`Android Studio`

![browse repositories](http://nos.netease.com/knowledge/4a9a692d-49f2-4752-a79e-306e878c95ac) 

![version 1.1](http://nos.netease.com/knowledge/ca2bf0a0-5c7f-4b9a-81bf-db469cb9b0dc)

## 1.2 安装 nei-toolkit

通过 `npm` 安装`nei`工具，安装指南详见<a>https://github.com/NEYouFan/nei-toolkit</a>
 
>注意：也可通过菜单项`Edit`->`NEI`->`install nei-toolkit`进行安装

步骤一：点击`Edit`->`NEI`->`install nei-toolkit`

![menu-install-nei-toolkit](http://nos.netease.com/knowledge/8f2b645b-433d-46e0-8369-9e13d95429e8)

步骤二：请先安装`npm`和`node`，然后指定`npm`和`node`的安装路径。

![select-npm-node-install path](http://nos.netease.com/knowledge/6ea60bc4-1ba5-42cd-a6ff-fdcaa59c1153)

步骤三：点击`OK`开始`nei-toolkit`的安装，`Nei Console`会显示安装进度，`Mac`版可能需要在`Nei Console`中输入密码。

![nei-install-console](http://nos.netease.com/knowledge/85478a5f-26d9-4550-b3a0-a8d561a69747)

# 2. 使用

## 2.1 指定 Android 工程规范

首先在[Nei接口管理平台](http://nei.netease.com/)为项目指定`Android`工程规范，`Android`工程规范的编写可参考[NEI 接口管理平台配套自动化工具](https://github.com/NEYouFan/nei-toolkit)NEI工程规范介绍。

![nei-aos-spec](http://nos.netease.com/knowledge/6c4faab8-9535-468f-a962-efcb2dd66acf)

## 2.2 参数配置

`nei`插件工具所需的参数，可在`nei.json`文件中进行配置，`nei.json`文件务必放在工程项目根目录下。

如下图所示，可在`nei.json`中配置
`appPackage`、`baseRequestClass`、`baseRequestModelClass`、`projectKey`等参数，分别对应插件`mobile`对话框中的`AppPackage`、`BaseRequestClass`、`BaseRequestModelClass`、`ProjectKey`等编辑框的默认输入。

``` java
/**
 * nei.json中各配置参数含义如下：
 * 1. appPackage：应用包名
 * 2. baseRequestClass：请求的基类，格式为全路径。必选，若不传入该参数，则不用生成请求文件。
 * 3. baseRequestModelClass：模型的基类，格式为全路径。
 * 4. projectKey：NEI平台上的项目的唯一标识，可以在项目的"工具(设置)"中查看
 */
{
  "appPackage": "com.netease.yourpackage",// 对应AppPackage
  "baseRequestClass": "com.netease.hearttouch.db.http.BaseRequest",// 对应BaseRequestClass
  "baseRequestModelClass":"com.netease.hearttouch.db.http.BaseModel",// 对应BaseRequestModelClass
  "projectKey":"XXXXXXXXXXXXXXXXXXXXXXXXXXX"// 对应ProjectKey
}

```

## 2.3 生成代码

点击`toolbar`上心形图标

![color_touch_icon](http://nos.netease.com/knowledge/78b8387a-8dce-4685-a1d3-518cd0466dfe)

或选择`Edit`菜单栏下的`mobile`

![menu-mobile](http://nos.netease.com/knowledge/7a4e205a-cf8b-4bbf-8a8e-088bca048a5f)

根据对话框指示，填写必要信息，若`nei.json`文件中配置了对应的参数，则编辑框会自动填充。

![nei mobile dialog](http://nos.netease.com/knowledge/8d3c38a3-e0f4-4186-8048-c29e35033ab5)

点击`ok`后，可在`Nei Console`下查看日志，刷新一下工程就能在侧边栏看到产生的`request`和`model`文件。

![nei-console-log](http://nos.netease.com/knowledge/48a4cfda-3715-43fc-b8e8-8844bb165f3f?imageView&thumbnail=980x0)

![hthttp-gen](http://nos.netease.com/knowledge/62c4dc7e-444a-4f15-bdda-0e42167c7c24)


# 3. 注意事项

	
## 3.1 配置源码文件夹 `hthttp-gen`

由于插件自动生成的模型类和请求类默认放在新增源码目录`app/src/main/hthttp-gen`下，因此需在`build.gradle`中配置如下：
	
	android{
		sourceSets {
	        main {
	            java {
	                srcDirs = ['src/main/java', 'src/main/hthttp-gen']
	            }
	        }
	    }
    }

## 3.2 jdk版本要求

本目录下的`ht-as-nei-plugin.jar`是在jdk1.6下打包的，因此使用时要求IDE所在的jdk环境为1.6及以上。

