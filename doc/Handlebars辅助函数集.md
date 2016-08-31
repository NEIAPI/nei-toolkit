# Handlebars辅助函数集

Handlebars 辅助函数集的 JavaScript 实现文件在[这里](../lib/nei/handlebars.util.js)

有自定义需求的可以提 issue 或者发 pull request 或者联系本工具作者

## 目前可用的 helper

### raw
用它包裹的内容按原样输出

```text
{{{{raw}}}}
  {{name}}
{{{{/raw}}}}

输出为: {{name}}
```

### upperFirst
将首字母大写

```js
var data = {
    "name": "id"
}
var template = `{{upperFirst name}}`;
console.log(Handlebars.compile(template)(data)); // 输出: Id
```

### lowerFirst
将首字母小写

```js
var data = {
    "name": "ProjectGroup"
}
var template = `{{lowerFirst name}}`;
console.log(Handlebars.compile(template)(data)); // 输出: projectGroup
```

### modelNameByList
获取模型的名称, 如果它是数组, 则使用 `List` 嵌套, 比如二维数组: `List<List<String>>`

```js
var data = {
    type: 'String',
    arrDim: 2
}
var template = `{{{modelNameByList this}}}`; // 使用三个大括号, 不转义特殊字符 `<` 和 `>`
console.log(Handlebars.compile(template)(data)); // 输出: List<List<String>>
```

### modelNameByBracket
获取模型的名称, 如果它是数组, 则使用 `[]` 嵌套, 比如二维数组: `String[][]`

```js
var data = {
    type: 'String',
    arrDim: 2
}
var template = `{{modelNameByBracket this}}`;
console.log(Handlebars.compile(template)(data)); // 输出: String[][]
```

### prettifyComment
格式化注释, 在每一行的前面添加 ` * `

```js
var data = {
    comment: 'a\nb\nc'
}
var template = `{{prettifyComment this}}`;
console.log(Handlebars.compile(template)(data)); // 输出: ' * a\n * b\n * c'
```

### noLineBreak
将换行替换为逗号

```js
var data = {
    comment: 'a\nb\nc'
}
var template = `{{noLineBreak this}}`;
console.log(Handlebars.compile(template)(data)); // 输出: 'a,b,c'
```
