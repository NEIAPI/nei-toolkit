NEI 平台目前支持 NEI 自定义的开放标准来批量导入测试用例。

## 导入 JSON 文件
你可以同时导入多个接口的多个测试用例，而区分不同接口，则是用`method`和`path`进行区分，其表现与 [NEI MockStore](./mockstore.md) 中一致。
### 格式
导入测试用例，其格式是一个对象，其中对象的`key`表示测试用例的所属接口，是用`method path`的形式标识，这个path可以是真实的路径而不需要显示写出对应的路径参数，路径参数可以通过用例的pathParams来设置，简而言之，`key`只用来标识是哪个接口，而对其他并没有影响。这个`key`对应的值是一个数组，表示需要导入该接口的用例列表。

```text
{
  "GET /api/users/": Array<NEITestcase>
}
```

#### NEITestcase

```javascript
class Testcase {
  name: string;
  description: string;
  pathParams: object;
  reqHeaders: object;
  reqData: object;
  resHeaders: object;
  resData: object;
}
```
这里对每一项进行说明
| 属性 | 含义 |
| ---- | ---- |
| name | 测试用例的名称，若提供，则使用提供值，否则会自动生成，格式为【接口名-时间名-序号】，您也可以在导入确认框中再进行修改 |
| description | 测试用例的描述 |
| pathParams | 用例的路径参数，是一个对象，对象的key表明路径参数的名称，对象的value表明对应的值 |
| reqHeaders | 用例的请求头，是一个对象，对象的key表明请求头的名称，对象的value表明对应的值 |
| reqData | 用例的请求数据，是一个对象，对象的key表明数据的名称，而值则是对这个数据的说明，也是一个对象，value表明数据的值，ignored表明该数据是否不发送 |
| resHeaders | 用例的响应头，是一个对象，对象的key表明响应头的名称，而值则是对这个响应头的说明，也是一个对象，value表明响应头的期望值，error表明该响应头在测试失败时的提示值 |
| resData | 用例的响应数据，是一个对象，对象的key表明数据的名称，而值则是对这个数据的说明，也是一个对象，value表明数据的期望值，error表明该数据在测试失败时的提示值 |

如一个示例数据如下 
```json
{
	"PATCH /api/users/1": [{
    "name":"测试用例1",
    "description": "更新用户信息",
    "pathParams": {
      "id": 10
    },
    "reqHeaders": {
      "Content-Type": "application/json"
    },
    "reqData": {
      "name": {
        "ignored": false,
        "value": "John"
      }
    },
    "resHeaders": {},
    "resData": {
      "name": {
        "value": "John",
        "error": "Unexpected name!"
      }
    }
  }]
}
```
