# NEI 平台系统预置的规则函数集

为了方便用户生成自定义的 mock 数据，NEI 平台预置了一些可以直接使用的常量和方法。为了不和用户自定义的规则函数产生冲突，它们都放在 `NEI` 名字空间里面。

## 可以使用的常量

### ALPHA_NUMERIC_CHARS

数字和大小写英文字符集，它的值为:

```js
console.log(NEI.ALPHA_NUMERIC_CHARS);
// 输出: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
```

### ALPHA_LOWER_CASE_CHARS

小写英文字符集，它的值为:

```js
console.log(NEI.ALPHA_LOWER_CASE_CHARS);
// 输出: 'abcdefghijklmnopqrstuvwxyz';
```

### NORMAL_CHINESE_CHARS

常见的中文汉字，共有 2500 个


## 可以调用的方法:

* [NEI.id()](#id)
* [NEI.str(len, min, chars)](#strlen-min-chars)
* [NEI.chinese(len, min)](#chineselen-min)
* [NEI.email()](#email)
* [NEI.url(protocol)](#urlprotocol)
* [NEI.num(max, min)](#nummax-min)
* [NEI.bool()](#bool)
* [NEI.var()](#var)
* [NEI.repeat(num, arrEleGenFunc, ...arrEleGenFuncArgs)](#repeatnum-arrelegenfunc-arrelegenfuncargs))
* [NEI.loop(num, arrRepeatNum)](#loopnum-arrrepeatnum)

### id()
返回一个唯一数值标识，用法:

```js
console.log(NEI.id()); // 输出随机数值，保证在当前 mock 结果中是唯一的
```

### str(len, min, chars)
返回一个随机字符串，参数说明:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| len | Number | 否 | 10 | 字符串长度，如果有 min 参数，则它表示最大长度 |
| min | Number | 否 | 无 | 字符串最小长度 |
| chars | String | 否 | ALPHA_NUMERIC_CHARS | 字符串集 |

使用方法:

```js
console.log(NEI.str()); // 输出随机字符串
```

### chinese(len, min)
返回一个随机中文字符串，参数说明:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| len | Number | 否 | 10 | 需要生成的字符串长度，如果有 min 参数，则它表示最大长度 |
| min | Number | 否 | 无 | 字符串最小长度 |

使用方法:

```js
console.log(NEI.chinese()); // 输出随机中文字符串
```

### email()
返回一个随机邮箱地址，参数: 无

使用方法:

```js
console.log(NEI.email()); // 输出随机邮箱地址
```

### url(protocol)
返回一个随机 url 地址，参数说明:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| protocol | String | 否 | http |  url 协议 |

使用方法:

```js
console.log(NEI.url()); // 输出随机 url 地址
```

### num(max, min)
返回一个随机数字，参数说明:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| max | Number | 否 | 100000 |  最大值 |
| min | Number | 否 | 0 |  最小值 |

使用方法:

```js
console.log(NEI.num()); // 输出随机数字
```

### bool()
返回一个随机布尔值，参数: 无

使用方法:

```js
console.log(NEI.bool()); // 输出随机布尔值
```

### var()
返回一个随机类型的值（调用 str、num 或者 bool 方法）， 它的参数会传给相应的函数

使用方法:

```js
console.log(NEI.var()); // 输出随机类型的值
```

### repeat(num, arrEleGenFunc, ...arrEleGenFuncArgs)

返回指定元素个数的数组。只对数组类型的参数有效。参数说明:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| num | Number | 否 | 3 | 生成的数组的元素个数 |
| arrEleGenFunc | Function | 否 | 无 | 数组元素的生成函数 |

> 注意: arrEleGenFunc 之后的参数会传给 arrEleGenFunc 方法

使用方法:

```js
console.log(NEI.repeat(10)); // 输出有 10 个元素的数组
console.log(NEI.repeat(10, NEI.url, 'https')); // 输出一个数组，它有 10 个元素，每个元素是一个 url 地址，并且 url 的协议是 https
```

### loop(num, arrRepeatNum)

当存在循环引用的时候（比如树型结构的数据）, 指定 mock 数据的生成层数。参数说明:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| num | Number | 否 | 3 | 指定 mock 数据的生成层数 |
| arrRepeatNum | Number | 否 | 3 | 如果参数属性是数组, 则指定数组的元素个数 |

使用方法:

```js
console.log(NEI.loop(3)); // 当存在循环引用时（比如树型结构的数据）, 生成 3 层数据
```


