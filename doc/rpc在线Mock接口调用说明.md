# RPC 在线 Mock 接口调用说明

为了方便模拟 RPC 接口调用的过程，NEI 提供了获取 RPC 接口响应结果的 Mock 数据的在线接口，接口可以跨域调用，方便开发人员在本地测试接口，现说明如下：

## 请求地址

```html
POST https://nei.netease.com/api/rpcmock/:projectKey/:apiPath
```

> 注意，接口只支持以 `POST` 方式调用

## 参数说明

| 名称 | 类型 | 是否必需 | 说明 |
| :--- | :--- | :--- | :--- |
| projectKey | String | 是 | 项目的唯一标识 Key，在项目的设置中查看 |
| apiPath | String | 是 | 见[下面的说明](#apiPath 计算规则) |

> 注意：
> - 如果找到多个符合要求的接口，则返回第一个找到的接口，结果可能是随机的。
> - 返回的 Mock 数据已经持久化。
> - projectKey 是项目的唯一标识，查看方式：[查看项目的 Key](./查看项目的Key.md)。

## apiPath 计算规则

apiPath 的规则如下：

- 将接口类名中的 `.` 替换成 `-`，得到结果 `x`。
- 将上述得到的结果 `x` 和接口方法名使用 `-` 字符连接。
- 将上述得到的结果字符串转换成小写。

比如一个 RPC 接口，它的类名是 `com.netease.usertool.api.AppCustomConfigRpcService`，方法名是 `updateConfig`，则最终计算得到的 `apiPath` 为：

```
com-netease-usertool-api-appcustomconfigrpcservice-updateconfig
```

## 查找目标接口的规则

在查找匹配的 RPC 接口时，会考虑方法的参数。也就是发送的 HTTP 请求体中，需要带上接口定义的参数。

参数只匹配名称，也就是只要名称相同即可，没有考虑参数的类型。

此外，只考虑了第一层的参数。


## 获取指定版本的接口

如果要获取指定版本的接口，需要将版本名称放在请求头 `nei-api-version` 中：

| 请求头名称 | 类型 | 是否必需 | 说明 |
| :--- | :--- | :--- | :--- |
| nei-api-version | String | 否 | 它的值就是接口的版本名称 |


## FAQ

>在线接口返回 403 没权限是怎么回事？

- 请检查接口的发送方式是否正确，注意，在浏览器中直接访问是 `GET` 方式，所以肯定是不成功的，其他方式需要使用其他工具，比如 [phosphorus](<https://nei.netease.com/phosphorus>)。
- 请检查项目的 Key 是否正确。

>能否模拟接口响应延时

- 可以。在接口详情页面中可以设置延时时间，也就是 `Mock 请求延时响应毫秒数` 的值，它是一个毫秒数值。




