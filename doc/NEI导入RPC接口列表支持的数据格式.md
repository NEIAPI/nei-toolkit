NEI 平台目前支持 Rpc Controller 文件 和 NEI 自定义的开放标准来批量导入接口。

## 导入 PRC Controller 文件

目前是使用了 [RPC_to_JSON](https://github.com/huntbao/rpc_to_json) 这个库来解析 PRC Controller 文件。

由于 Java 代码的复杂性，这个库并没有完全支持所有可能的 Java 语法，它有一定的使用要求，特别是对 RPC 接口的返回值，规范的做法是返回一个模型，比如 `RpcResult`，而不是只简单地返回一个基本类型。

## 导入 JSON 文件

由于 RPC 接口的数据格式和 HTTP 接口是一模一样的，所以在导入的时候只要组装出和导入 HTTP 接口时所需要的数据即可，具体格式请参考：[NEI 导入 HTTP 接口列表支持的数据格式](./NEI导入HTTP接口列表支持的数据格式.md) 中的 `NEI自定义标准批量导入接口` 小节的描述。

## FAQ
Q：我的 RPC Controller 文件解析失败怎么办？

A：首先请遵守业界比较通用的做法规范，如果还是解析失败，请在 [RPC_to_JSON](https://github.com/huntbao/rpc_to_json) 这个库中提 issue，NEI 的开发人员会尽可能地来实现大家的需求。

