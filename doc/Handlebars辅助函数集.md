# Handlebars辅助函数集

Handlebars 辅助函数集的 JavaScript 实现文件在[这里](../lib/nei/handlebars.util.js)

有自定义需求的可以提 issue 或者发 pull request 或者联系本工具作者

## 目前可用的 helper

### capFirst: 将首字母大写

```js
var data = {
    "name": "id"
}
var template = `{{capFirst name}}`;
console.log(Handlebars.compile(template)(data)); // 输出: Id
```

### raw: 用它包裹的内容按原样输出

```text
{{{{raw}}}}
  {{name}}
{{{{/raw}}}}

输出为: {{name}}
```
