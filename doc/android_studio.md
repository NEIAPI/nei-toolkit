# 1. 安装

## 1.1 点击 `Android Studio`,选择`Preference`->`Plugins`,然后选择`install from disk`,安装本目录下的`ht-as-nei-plugin.jar`。或者直接搜索`NeiPlugin`，点击安装，接着重启更新`Android Studio`

![install_form_disk](http://nos.netease.com/knowledge/1fa9197f-7721-4146-b89b-46d96955ec13)

## 1.2 通过npm 安装`nei`工具，安装指南详见<a>https://github.com/NEYouFan/nei-toolkit</a>
 
>注意：也可通过菜单项`Edit`->`NEI`->`install nei-toolkit`进行安装  

步骤一：点击`Edit`->`NEI`->`install nei-toolkit`

![menu-install-nei-toolkit](http://nos.netease.com/knowledge/3f06502b-ac05-448f-8a80-04f465c82df1)

步骤二：请先安装`npm`和`node`，然后指定`npm`和`node`的安装路径。

![select-npm-node-install path](http://nos.netease.com/knowledge/f5197f3a-5fbc-4a87-905a-de4a3649b026)

步骤三：点击`OK`开始`nei-toolkit`的安装，`Nei Console`会显示安装进度，`Mac`版可能需要在`Nei Console`中输入密码。

![nei-install-console](http://nos.netease.com/knowledge/85478a5f-26d9-4550-b3a0-a8d561a69747)
 
## 1.3 在本地按照 [ht-template](https://g.hz.netease.com/hearttouch-android/ht-template) 的教程，生成工程项目

>注意：也可通过菜单项`Edit`->`NEI`->`install ht-template`进行安装  

步骤一：点击`Edit`->`NEI`->`install ht-template`

![menu-install-template](http://nos.netease.com/knowledge/db10c648-86d8-4766-b8d4-000613986acd)

步骤二：选择`Android Studio`的安装目录，`Mac`系统指定到`Android Studio.app`目录即可，`Windows`系统指定到`Android Studio`目录即可。

![select-android studio-install path](http://nos.netease.com/knowledge/fdc25f72-5ad7-44cb-8788-979f9597ea9f)

步骤三：安装成功后的文件路径为`Android Studio.app/Contents/plugins/android/lib/templates/activities/HTTemplate`（`Mac`）或`${android studio 安装路径}/plugins/android/lib/templates/activities/HTTemplate`（`Windows`）

![httemplate-install-success](http://nos.netease.com/knowledge/764cfca6-d836-4899-8b02-3c73c1d3d016?imageView&thumbnail=980x0)
 

# 2. 使用

## 2.1  首先在[Nei接口管理平台](http://nei.netease.com/)为项目指定`Android`工程规范，`Android`工程规范的编写可参考[NEI 接口管理平台配套自动化工具](https://github.com/NEYouFan/nei-toolkit)NEI工程规范介绍。

![nei-aos-spec](http://nos.netease.com/knowledge/6c4faab8-9535-468f-a962-efcb2dd66acf)

## 2.2  确保生成的工程项目根目录下有`nei.json`文件

## 2.3 点击 toolbar 上心形图标![color_touch_icon](http://nos.netease.com/knowledge/78b8387a-8dce-4685-a1d3-518cd0466dfe),或选择Edit菜单栏下的mobile![menu-mobile](http://nos.netease.com/knowledge/22d17bf0-cb20-4af8-a1d0-e2c7a8513adf),根据对话框指示，填写必要信息，生成request和model文件

![nei mobile dialog](http://nos.netease.com/knowledge/482bb7e5-bd34-4c43-8a0d-aad22e1af1a1)


> `nei`工具所需的参数，可在nei.json文件中进行配置。如下图所示，可在nei.json中配置`appPackage`、`baseRequestClass`、`baseRequestModelClass`、`projectKey`等参数，分别对应mobile对话框中的`AppPackage`、`BaseRequestClass`、`BaseRequestModelClass`、`ProjectKey`等编辑框的默认输入。

``` java
/**
 * nei.json中各配置参数含义如下：
 * 1. appPackage：应用包名
 * 2. baseRequestClass：请求的基类，格式为全路径。必选，若不传入该参数，则不用生成请求文件。
 * 3. baseRequestModelClass：模型的基类，格式为全路径。
 * 4. projectKey：NEI平台上的项目的唯一标识，可以在项目的"工具(设置)"中查看
 */
{
  "appPackage": "com.netease.poct.poctapp",// 对应AppPackage
  "baseRequestClass": "com.netease.hearttouch.http.BaseRequest",// 对应BaseRequestClass
  "baseRequestModelClass":"com.netease.hearttouch.http.BaseModel",// 对应BaseRequestModelClass
  "projectKey":"XXXXXXXXXXXXXXXXXXXXXXXXXXX"// 对应ProjectKey
}

```

## 2.4 点击`ok`后，可在`Nei Console`下查看日志，刷新一下工程就能在侧边栏看到产生的请求和model文件。

![nei-console-log](http://nos.netease.com/knowledge/48a4cfda-3715-43fc-b8e8-8844bb165f3f?imageView&thumbnail=980x0)

![hthttp-gen](http://nos.netease.com/knowledge/62c4dc7e-444a-4f15-bdda-0e42167c7c24)


# 3. 注意事项

> 注意：本目录下的`ht-as-nei-plugin.jar`是在jdk1.6下打包的，因此使用时要求IDE所在的jdk环境为1.6及以上。

## 3.1 如何查看自己的IDE在哪个jdk下运行

`XXX JetBrainIDE`-> `About XXX`

 ![about_example](http://nos.netease.com/knowledge/d50d9bf9-ace2-4abd-a99d-ef208143801a)


## 3.2 如何配置自己的IDE在哪个jdk下运行


`android studio`

* windows及其他 <a>http://tools.android.com/tech-docs/configuration</a>
* mac <a>http://tools.android.com/tech-docs/configuration/osx-jdk</a>
