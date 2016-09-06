# config/db

数据库常量配置

## 前端使用

```javascript
NEJ.define([
    'json!/path/to/fb-modules/config/db.json'
],function(db){
    console.log(db.USR_FRM_URS);
    // TODO something
});
```

## 后端使用

```javascript
var db = require('fb-modules').db;
console.log(db.USR_FRM_URS);
```

## 字段说明


### 通用字段

| 字段 | 描述 |
| :--- | :--- |
| CMN_FLG_OFF | 所有开关的关闭状态值 |
| CMN_FLG_ON  | 所有开关的开启状态值 |
| CMN_BOL_NO  | 所有“is_”开始的字段反值 |
| CMN_BOL_YES | 所有“is_”开始的字段正值 |
| CMN_TYP_WEB | WEB类型，包括工程规范、视图类型等等 |
| CMN_TYP_AOS | Android类型 |
| CMN_TYP_IOS | iOS类型 |
| CMN_TYP_TEST | 测试类型 |
| CMN_ACT_ADD | 操作行为 - 添加，针对所有资源的操作历史 |
| CMN_ACT_DELETE | 操作行为 - 删除 |
| CMN_ACT_UPDATE | 操作行为 - 更新 |
| CMN_ACT_SHARE | 操作行为 - 共享 |
| CMN_ACT_FOLLOW | 操作行为 - 关注 |
| CMN_ORD_CUSTOM | 排序方式 - 自定义排序 |
| CMN_ORD_NAME_ASC | 排序方式 - 名称升序 |
| CMN_ORD_NAME_DESC | 排序方式 - 名称降序 |
| CMN_ORD_TIME_ASC | 排序方式 - 时间升序 |
| CMN_ORD_TIME_DESC | 排序方式 - 时间降序 |
| CMN_ORD_COUNT_ASC | 排序方式 - 计数升序 |
| CMN_ORD_COUNT_DESC | 排序方式 - 计数降序 |

### 用户相关字段

| 字段 | 描述 |
| :--- | :--- |
| USR_FRM_SITE | 用户来源 - 站内用户 |
| USR_FRM_OPENID | 用户来源 - 网易内部OPENID |
| USR_FRM_URS | 用户来源 - URS接入 |
| USR_ADMIN_ID | 系统管理员ID |
| USR_ROP_NONE | 账号申诉处理结果 - 未处理 |
| USR_ROP_PASS | 账号申诉处理结果 - 人工处理通过 |
| USR_ROP_REFUSE | 账号申诉处理结果 - 人工处理不通过 |
| USR_ROP_SYSTEM | 账号申诉处理结果 - 系统处理不通过 |
| USR_ROL_NONE | 用户角色 - 未设置 |
| USR_ROL_OTHER | 用户角色 - 其他角色 |
| USR_ROL_PM | 用户角色 - 项目经理 |
| USR_ROL_FRONT | 用户角色 - 前端工程师 |
| USR_ROL_BACK | 用户角色 - 后端工程师 |
| USR_ROL_IOS | 用户角色 - IOS工程师 |
| USR_ROL_AOS | 用户角色 - AOS工程师 |
| USR_ROL_TEST | 用户角色 - 测试工程师 |
| USR_ROL_OM | 用户角色 - 运维工程师 |

### 规范相关字段

| 字段 | 描述 |
| :--- | :--- |
| SPC_NOD_DIR | 规范目录结构节点类型 - 目录 |
| SPC_NOD_FILE | 规范目录结构节点类型 - 文件 |
| SPC_ENG_NONE | WEB规范使用模板引擎 - 未设置 |
| SPC_ENG_FREEMARK | WEB规范使用模板引擎 - FreeMarker |
| SPC_ENG_VELOCITY | WEB规范使用模板引擎 - Velocity |
| SPC_ENG_EJS | WEB规范使用模板引擎 - EJS |
| SPC_ENG_SWIG | WEB规范使用模板引擎 - Swig |
| SPC_ENG_SMARTY | WEB规范使用模板引擎 - Smarty |
| SPC_LNG_UNKNOWN | 规范实现语言 - 其他 |
| SPC_LNG_JAVA | 规范实现语言 - JAVA |
| SPC_LNG_NODE | 规范实现语言 - NODE |
| SPC_LNG_PHP | 规范实现语言 - PHP |
| SPC_LNG_SWIFT | 规范实现语言 - SWIFT |
| SPC_LNG_OC | 规范实现语言 - OBJECTIVE-C |
| SPC_MAP_SPEC | 规范映射来源 - 规范 |
| SPC_MAP_PROGROUP | 规范映射来源 - 项目组 |
| SPC_MAP_PROJECT | 规范映射来源 - 项目 |
| SPC_SYS_MAVEN | 系统预置工程规范ID - MAVEN工程 |
| SPC_SYS_NODE | 系统预置工程规范ID - NODE工程 |
| SPC_DTS_NONE | 填充数据模型类型 - 无填充 |
| SPC_DTS_INTERFACE | 填充数据模型类型 - 接口列表填充 |
| SPC_DTS_DATATYPE | 填充数据模型类型 - 数据类型列表填充 |
| SPC_DTS_TEMPLATE | 填充数据模型类型 - 模板列表填充 |
| SPC_DTS_WEBVIEW | 填充数据模型类型 - 页面视图列表填充 |


### 项目组相关字段

| 字段 | 描述 |
| :--- | :--- |
| PRG_TYP_NORMAL | 用户创建的普通项目组 |
| PRG_TYP_DEFAULT | 系统自带默认项目组 |
| PRG_TYP_HIDDEN | 系统内置隐藏项目组 |
| PRG_VRF_AUTH | 项目组权限申请验证方式 - 验证通过 |
| PRG_VRF_PASS | 项目组权限申请验证方式 - 自动通过 |
| PRG_ROL_GUEST | 项目组成员角色 - 观察者/访客 |
| PRG_ROL_DEVELOPER | 项目组成员角色 - 开发工程师 |
| PRG_ROL_TESTER | 项目组成员角色 - 测试工程师 |
| PRG_ROL_ADMIN | 项目组成员角色 - 管理员 |
| PRG_ROL_OWNER | 项目组成员角色 - 拥有者 |
| PRG_ROP_NONE | 项目组权限申请验证结果 - 未操作 |
| PRG_ROP_PASS | 项目组权限申请验证结果 - 管理员通过验证 |
| PRG_ROP_REFUSE | 项目组权限申请验证结果 - 拒绝加入项目组 |
| PRG_ROP_SYSTEM | 项目组权限申请验证结果 - 系统自动通过验证 |
| PRG_SYS_HIDDEN | 系统内置隐藏项目组ID |

### 项目相关字段

| 字段 | 描述 |
| :--- | :--- |
| PRO_TYP_NORMAL | 项目类型 - 用户创建的普通项目 |
| PRO_TYP_COMMON | 项目类型 - 共享/通用资源项目 |
| PRO_TYP_HIDDEN | 项目类型 - 不可见项目 |
| PRO_SYS_HIDDEN | 系统内置隐藏项目ID |

### 数据类型相关字段

| 字段 | 描述 |
| :--- | :--- |
| MDL_TYP_NORMAL | 数据类型 - 用户创建的普通数据类型 |
| MDL_TYP_SYSTEM | 数据类型 - 系统预置类型 |
| MDL_TYP_HIDDEN | 数据类型 - 系统生成的不可见类型/匿名数据类型 | 
| MDL_FMT_HASH | 数据类型格式 - 哈希表 |
| MDL_FMT_ENUM | 数据类型格式 - 枚举类型 |
| MDL_FMT_ARRAY| 数据类型格式 - 数组 |
| MDL_FMT_STRING | 数据类型格式 - 字符串 |
| MDL_FMT_NUMBER | 数据类型格式 - 数值型 |
| MDL_FMT_BOOLEAN | 数据类型格式 - 布尔型 |
| MDL_FMT_FILE | 数据类型格式 - 文件类型 |
| MDL_SYS_UNKNOWN | 系统内置数据类型 - 未知类型ID |
| MDL_SYS_FILE | 系统内置数据类型 - 文件类型ID |
| MDL_SYS_VARIABLE | 系统内置数据类型 - 可变类型ID |
| MDL_SYS_STRING | 系统内置数据类型 - 字符串类型ID |
| MDL_SYS_NUMBER | 系统内置数据类型 - 数值类型ID |
| MDL_SYS_BOOLEAN | 系统内置数据类型 - 布尔类型ID |

### 接口相关字段

| 字段 | 描述 |
| :--- | :--- |
| API_TYP_REQUEST | 接口类型 - 异步请求接口 |
| API_TYP_MODULE | 接口类型 - 模块接口 |
| API_TST_TODO | 接口测试用例执行结果 - 未测试 |
| API_TST_PASS | 接口测试用例执行结果 - 通过测试 |
| API_TST_FAILED | 接口测试用例执行结果 - 测试失败 |
| API_HED_REQUEST | 接口头信息标识 - 请求头 |
| API_HED_RESPONSE | 接口头信息标识 - 响应头 |

### 参数相关字段

| 字段 | 描述 |
| :--- | :--- |
| PAM_TYP_QUERY | 参数类别 - 页面请求参数 |
| PAM_TYP_VMODEL | 参数类别 - 视图模板预填数据模型 |
| PAM_TYP_INPUT | 参数类别 - 接口输入参数 |
| PAM_TYP_OUTPUT | 参数类别 - 接口输出参数 |
| PAM_TYP_ATTRIBUTE | 参数类别 - 数据类型属性 |

### 资源相关字段

| 字段 | 描述 |
| :--- | :--- |
| RES_TYP_SPEC | 资源类别 - 规范 |
| RES_TYP_PROGROUP | 资源类别 - 项目组 |
| RES_TYP_PROJECT | 资源类别 - 项目 |
| RES_TYP_WEBVIEW | 资源类别 - WEB视图/页面 |
| RES_TYP_TEMPLATE | 资源类别 - WEB视图模板 |
| RES_TYP_INTERFACE | 资源类别 - 接口 |
| RES_TYP_DATATYPE | 资源类别 - 数据类型 |
| RES_TYP_BISGROUP | 资源类别 - 业务分组 |
| RES_TYP_CONSTRAINT | 资源类别 - 约束函数 |
| RES_TYP_TESTCASE | 资源类别 - 测试用例 |

### 业务分组相关

| 字段 | 描述 |
| :--- | :--- |
| BIS_TYP_NORMAL | 业务分组 - 用户创建分组 |
| BIS_TYP_SYSTEM | 业务分组 - 默认分组 |
| BIS_TYP_HIDDEN | 业务分组 - 隐藏分组 |
| BIS_SYS_HIDDEN |业务分组 - 隐藏分组ID |

### 消息相关资源

| 字段 | 描述 |
| :--- | :--- |
| MSG_TYP_SYSTEM | 消息类别 - 系统消息 |
| MSG_TYP_PRIVATE | 消息类别 - 个人消息 |

