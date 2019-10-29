在项目组的设置页面，你可以制定项目组的HTTP接口规范，使得团队在定义HTTP接口上达成一致。

其中，`请求路径规范` `参数规范` `请求方式规范` `标签规范` ，规范的判断使用正则表达式，不需要在头部添加`/`，不支持正则表达式的标志（flag），建议添加`^`与`$`匹配开头与结尾来防止一些错误情形的出现。

* 注意：为了兼容老接口，约定在设置规范之前创建的接口时，对于不规范的输入，只会提示，不会限制更新。

### 请求路径规范
该规范匹配HTTP接口的路径（接口创建时填写的路径，接口更新路径时）。
比如，请求路径强制小写，可以使用路径参数的正则表达式为`^\/[a-z0-9/:{}-]+(\?([a-zA-Z0-9=&:{}]+)*)?$`

### 参数规范
该规范匹配HTTP接口中的所有参数的名称。  
比如，参数可以使用驼峰的正则表达式为`^[a-z][a-zA-Z0-9]*$`

### 参数的描述规范
该规范匹配HTTP接口中的所有参数的描述信息。
比如，希望参数的描述必须填写，则可以使用非空的正则表达式为`\S+`

### 请求方式规范
该规范匹配HTTP接口中的请求方式。
比如，只能使用`GET`方法或`POST`方法请求的正则表达式为`^(GET|POST)$`

### 标签规范
该规范匹配HTTP接口中的标签。

### 响应结果规范
该规范匹配HTTP接口的响应结果的参数定义。

#### 响应结果规范数据模型
该规范使用json来定义，其定义的形式为`Array<Rule>`，其中`Rule`的数据模型如下

```js
class Rule {
  name: String;
  type: Array<String>;
  required: Number;
}
```

各字段的解释如下  

| 参数名 | 说明 |
| ----- | ---- |
| name | 匹配HTTP接口响应结果的参数名称，注意，该匹配只匹配了第一层的参数 |
| type | 匹配HTTP接口响应结果的参数类型，可以匹配多个，可选值为 `String`，`Number`，`Boolean`，`File`，`Variable`，`Array`，`Object`，其中，若是匹配数组，则在头部加上`Array`，如匹配一个数组，其数组的元素类型是数组，则type为`Array Array` |
| required | 该匹配规则匹配的参数是否是必需的，若必需，则参数的定义也必须为必需参数 |

如一个合理的配置如下：

```json
[
  {
    "name": "code",
    "type": [
      "Number"
    ],
    "required": 1
  },
  {
    "name": "msg",
    "type": [
      "String"
    ],
    "required": 1
  },
  {
    "name": "result",
    "type": [
      "Array Object"
    ],
    "required": 1
  }
]
```


### 接口出入参规范

通过定义接口出入参规范，你可以对 NEI 项目组中某一类接口的出入参进行校验。接口出入参规范数据类型的 `TypeScript` 定义如下
```ts
interface InterfaceSchema {
    [interfaceSchemaName: string]: {
        reqMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD',
        req?: object,
        res?: object
    }
}
```

| 参数名 | 说明 |
| ----- | ---- |
| interfaceSchemaName | 接口出入参规范的名称 |
| reqMethod | 接口的请求类型 |
| req | 请求参数规范：为一个 [JSON Schema](http://json-schema.org/latest/json-schema-validation.html) 对象，你也可参考 NEI 所使用的 JSON Schema 校验库 [AJV](https://ajv.js.org/) 的文档来了解如何书写该对象 |
| res | 响应参数规范：为一个 [JSON Schema](http://json-schema.org/latest/json-schema-validation.html) 对象，你也可参考 NEI 所使用的 JSON Schema 校验库 [AJV](https://ajv.js.org/) 的文档来了解如何书写该对象 |

#### 示例

如我们希望规范下面`分页`类型的接口入参
```js
{
  "page": {
    "from": 1, // 必选。 原页
    "to": 1, // 必选。 去向页
    "size": 5, // 必选。 每页数量
    "cursor": "3232" // 可选。游标
  }
}
```
那么我们即可定义`接口出入参规范`为如下的 `JSON`
```json
{
    "分页": {
        "req": {
            "type": "object",
            "required": [
                "page"
            ],
            "properties": {
                "page": {
                    "type": "object",
                    "required": [
                        "from",
                        "to",
                        "size",
                    ],
                    "additionalProperties": false,
                    "properties": {
                        "from": {
                            "type": "number"
                        },
                        "to": {
                            "type": "number"
                        },
                        "size": {
                            "type": "number"
                        },
                        "cursor": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    }
}
```

* 注意，定义了该规范，则该项目组定义接口时的响应参数都必须严格遵守该规范。不允许有多余的参数创建，对于一些定义时间晚于该规范创建的接口（指只要上述任意规范进行创建即为创建），若原接口已经存在不符合规范的参数定义，可以先删除再重新定义。
