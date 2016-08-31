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

### ifCond
支持的逻辑运算有: '=='、'==='、'<'、'<='、'>'、'>='、'&&'、'||'

模板中的写法:

```js
{{#ifCond var1 '==' var2}}
```


### extname
以点号分隔字符串后的最后一项, 相当于根据路径取文件的扩展名

```js
var data = {
    path: 'a.b.c'
}

var template = `{{extname path}}`;
console.log(Handlebars.compile(template)(data)); // 输出: 'c'

```

### fieldTypeName
获取字段的名称, 如果它是数组, 则使用 `[]` 嵌套, 比如二维数组: `String[][]`。

也可以使用 `List` 嵌套, 比如二维数组: List<List<String>>

```js
var data = {
    type: 'String',
    arrDim: 2
}

var template = `{{fieldTypeName this}}`;
console.log(Handlebars.compile(template)(data)); // 输出: String[][]

template = `{{fieldTypeName this useList=true}}`;
console.log(Handlebars.compile(template)(data)); // 输出: List<List<String>>

// 也可以使用下面这种方式传入参数:

var template = `{{fieldTypeName type=this.type arrDim=this.arrDim}}`;
console.log(Handlebars.compile(template)(data)); // 输出: String[][]

var template = `{{fieldTypeName type=this.type arrDim=this.arrDim useList=true}}`;
console.log(Handlebars.compile(template)(data)); // 输出: List<List<String>>

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

### noLineBreak
将换行替换为逗号(默认)或者自定义分隔符

```js
var data = {
    comment: 'a\nb\nc'
}

var template = `{{noLineBreak comment}}`;
console.log(Handlebars.compile(template)(data)); // 输出: 'a,b,c'

var template = `{{noLineBreak comment sep="*"}}`;
console.log(Handlebars.compile(template)(data)); // 输出: 'a*b*c'

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

### upperFirst
将首字母大写

```js
var data = {
    "name": "id"
}
var template = `{{upperFirst name}}`;
console.log(Handlebars.compile(template)(data)); // 输出: Id
```