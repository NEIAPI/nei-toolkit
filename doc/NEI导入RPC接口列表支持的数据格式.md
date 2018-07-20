NEI 平台目前支持 Rpc Controller 文件 和 NEI 自定义的开放标准来批量导入接口。

## 导入 PRC Controller 文件

目前是使用了 [RPC_to_JSON](https://github.com/huntbao/rpc_to_json) 这个库来解析 PRC Controller 文件。

由于 Java 代码的复杂性，这个库并没有完全支持所有可能的 Java 语法，它有一定的使用要求，特别是对 RPC 接口的返回值，规范的做法是返回一个模型，比如 `RpcResult`，而不是只简单地返回一个基本类型。

## 导入 JSON 文件

由于 RPC 接口的数据格式和 HTTP 接口是一模一样的，所以在导入的时候只要组装出和导入 HTTP 接口时所需要的数据即可，具体格式请参考：[NEI 导入 HTTP 接口列表支持的数据格式](./NEI导入HTTP接口列表支持的数据格式.md) 中的 `NEI自定义标准批量导入接口` 小节的描述。

[RPC_to_JSON](https://github.com/huntbao/rpc_to_json) 中的示例文件 [sample.java](https://github.com/huntbao/rpc_to_json/blob/master/sample/sample.java)，和下面的 JSON 代码等价：

```json
{
  "rpcs": [
    {
      "name": "更新配置内容",
      "description": "更新配置内容",
      "className": "com.sample.api",
      "path": "updateConfig",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [
          {
            "name": "id",
            "description": "id",
            "isArray": 0,
            "typeName": "Number",
            "required": 1
          },
          {
            "name": "newConfig",
            "description": "新的配置内容",
            "isArray": 0,
            "typeName": "String",
            "required": 1
          },
          {
            "name": "json",
            "description": "是否是json",
            "isArray": 0,
            "typeName": "Boolean",
            "required": 1
          }
        ],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    },
    {
      "name": "获取配置内容",
      "description": "获取配置内容",
      "className": "com.sample.api",
      "path": "getConfigValue",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [
          {
            "name": "key",
            "description": "配置型名称",
            "isArray": 0,
            "typeName": "String",
            "required": 1
          }
        ],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    },
    {
      "name": "获取配置项列表，按添加时间排序",
      "description": "获取配置项列表，按添加时间排序",
      "className": "com.sample.api",
      "path": "listForBackend",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [
          {
            "name": "limit",
            "description": "limit",
            "isArray": 0,
            "typeName": "Number",
            "required": 1
          },
          {
            "name": "offset",
            "description": "offset",
            "isArray": 0,
            "typeName": "Number",
            "required": 1
          }
        ],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    },
    {
      "name": "获取所有的配置",
      "description": "获取所有的配置",
      "className": "com.sample.api",
      "path": "getAllConfigList",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    },
    {
      "name": "获取所有的配置项",
      "description": "获取所有的配置项",
      "className": "com.sample.api",
      "path": "getAllConfigs",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [],
        "outputs": []
      }
    },
    {
      "name": "删除配置",
      "description": "删除配置",
      "className": "com.sample.api",
      "path": "deleteConfigById",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [
          {
            "name": "id",
            "description": "id",
            "isArray": 0,
            "typeName": "Number",
            "required": 1
          }
        ],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    },
    {
      "name": "添加配置",
      "description": "添加配置",
      "className": "com.sample.api",
      "path": "addConfig",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [
          {
            "name": "key",
            "description": "配置项名称",
            "isArray": 0,
            "typeName": "String",
            "required": 1
          },
          {
            "name": "value",
            "description": "配置项内容",
            "isArray": 0,
            "typeName": "String",
            "required": 1
          },
          {
            "name": "json",
            "description": "是否是json",
            "isArray": 0,
            "typeName": "Boolean",
            "required": 1
          }
        ],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    },
    {
      "name": "load所有数据到cache中",
      "description": "load所有数据到cache中",
      "className": "com.sample.api",
      "path": "loadAllConfigToCacheInBackend",
      "reqFormat": 0,
      "resFormat": 0,
      "params": {
        "inputs": [],
        "outputs": [
          {
            "datatypeName": "RpcResult"
          }
        ]
      }
    }
  ],
  "datatypes": [
    {
      "name": "RpcResult"
    }
  ]
}
```

## FAQ
Q：我的 RPC Controller 文件解析失败怎么办？

A：首先请遵守业界比较通用的做法规范，如果还是解析失败，请在 [RPC_to_JSON](https://github.com/huntbao/rpc_to_json) 这个库中提 issue，NEI 的开发人员会尽可能地来实现大家的需求。

