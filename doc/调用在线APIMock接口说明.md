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
> - 如果找到多个符合要求的接口，则返回的接口是随机的，其他情况见[查询参数的匹配规则](#查询参数的匹配规则)的说明。
> - 目前返回的 Mock 数据是随机生成的，没有持久化。以后会考虑做持久化功能。
> - projectKey 是项目的唯一标识，不要泄漏给其他人，不然你的项目数据就会被其他人获取到。隔段时间重新生成 projectKey 是个好习惯。

## 获取指定版本的接口

如果要获取指定版本的接口，需要将版本名称放在请求头 `nei-api-version` 中：

| 请求头名称 | 类型 | 是否必需 | 说明 |
| :--- | :--- | :--- | :--- |
| nei-api-version | String | 否 | 它的值就是接口的版本名称 |

## 查询参数的匹配规则

一般来说，如果接口的 method 和 path（请求地址，不包含查询参数）一样，则它们是同一个接口。

但有时候，我们希望可以通过查询参数映射到 Controller 或者 Service 的不同方法，比如下面两个接口 A 和 B：

接口 A：
```html
POST /api/users/:id
```

接口 B：
```html
POST /api/users/:id?lock
```

接口 A 是修改用户信息，接口 B 是锁定用户，这在后端肯定有两个对应的方法，可以在 Controller 中通过查询参数的不同，调用不同的 Service 方法。

考虑到上述原因，在查询目标接口时，会匹配查询参数并且遵循最大匹配原则，即：

- 接口定义中的请求地址（注意，是 NEI 平台上定义的请求地址，不包含请求参数），如果有查询参数，则在实际请求中，这些查询参数**必须全部出现，只能多不能少**。
- 如果匹配到了多个接口，则请求地址长度最长的接口胜出。

比如，如果实际请求是：

```html
POST /api/users/:123?lock
```

则接口 A 和接口 B 都匹配，因为接口 B 的请求地址长度大于接口 A 的请求地址长度，所以最终匹配的是接口 B。

再比如，如果实际请求是：

```html
POST /api/users/123
```

则只有接口 A 匹配，因为接口 B 中的查询参数 `lock` 在实际请求中不存在，匹配失败。所以最终匹配的是接口 A。


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

## 异常情况说明

- 如果生成 Mock 数据的过程中有错误发生，则会把错误信息放在响应结果的 `_nei_apimock_error` 字段中。比如生成规则的代码有语法错误等。
- 如果生成 Mock 数据花费的时间超过 1000 毫秒，则会报超时错误，此时响应结果是 `Script execution timed out.`。比如生成规则中有死循环。
