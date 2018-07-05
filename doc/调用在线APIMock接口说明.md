NEI 目前已经发布了获取 API Mock 数据的在线接口，可以跨域调用，方便开发人员在本地测试接口，现说明如下：

## 请求地址

```html
https://nei.netease.com/api/apimock/:projectKey/:apiPath
```

## 参数说明

| 名称 | 类型 | 是否必需 | 说明 |
| :--- | :--- | :--- | :--- |
| projectKey | String | 是 | 项目的唯一标识 Key，在项目的设置中查看 |
| apiPath | String | 是 | NEI 中定义的接口地址 |

> 注意：
> - 请求的 method 必须和 NEI 中的定义保持一致。
> - 如果找到多个符合要求的接口，则只返回第一个接口的 Mock 数据。
> - 目前返回的 Mock 数据是随机生成的，没有持久化。以后会考虑做持久化功能。
> - projectKey 是项目的唯一标识，不要泄漏给其他人，不然你的项目数据就会被其他人获取到。隔段时间重新生成 projectKey 是个好习惯。

## 获取指定版本的接口

如果要获取指定版本的接口，需要将版本名称放在请求头 `nei-api-version` 中：

| 请求头名称 | 类型 | 是否必需 | 说明 |
| :--- | :--- | :--- | :--- |
| nei-api-version | String | 否 | 它的值就是接口的版本名称 |

## 调用示例
下面演示获取 TodoDemo 项目的 `Todo-获取列表` 接口的响应结果 Mock 数据，这个接口的地址是 `/api/todos/`，请求方式是 `GET`，最终的请求代码如下：

```js
const apiMockUrl = 'https://nei.netease.com/api/apimock/';
const projectKey = 'b209329e46daae533ac0649051abcba9';
const apiPath = '/api/todos/';
const apiMethod = 'GET';
const url = `${apiMockUrl}${projectKey}${apiPath}`;
fetch(url, {
  method: apiMethod
}).then((res) => {
  return res.json();
}).then((json) => {
  // mock 数据
  console.log(json);
});
```
