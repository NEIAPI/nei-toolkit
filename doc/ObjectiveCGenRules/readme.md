# iOS 客户端代码生成规则

##### 为表达简洁起见，本文作如下说明及约定：

1. 位于 `{{` 和 `}}` 之间的是可替换内容。
2. 本文代码中的注释是辅助说明，和最终生成的代码无关。
3. OC 指 Objective-C 语言。
4. `{{namePrefix}}`，生成的文件名、类名的前缀，通过命令行参数传入，默认值为 `HT`。
5. `{{reqAbstract}}`，模型的基类，通过命令行参数传入，默认值为 `BaseRequest`。
6. `{{modelAbstract}}`，数据模型基类名称，通过命令行参数传入，默认值为 `HTTPModel`。

### 一、NEI 中的数据类型和 OC 语言中的数据类型的对应关系

| NEI 数据类型  | OC 数据类型 | 说明 |
| :--- | :--- | :---
| `String` | `NSString` | 属性修饰符为 copy, 带* |
| `Number` | `CGFloat` | 属性修饰符为 assign, 为统一，转为 OC 数据类型时都用 CGFloat, 不带* |
| `Boolean` | `BOOL` | 属性修饰符为 assign, 不带* |
| `Array` | `NSArray` | 属性修饰符为 strong, 并且带上类型信息, 详见下一行, 带* |
| `Array<SpecVO>` | `NSArray<SpecVO *>` | 属性修饰符为 strong, 带上类型信息, 带* |
| 枚举类型 | `NSString` | 属性修饰符为 copy, 带* |
| `Variable` | `id` | 尽量避免可变类型, 属性修饰符为 strong, 不带* |
| `自定义类型` | `同名自定义类型` | 属性修饰符为 strong, 带*，工具会生成自定义数据类型的 Model 文件 |

##### 说明：

1. 可变类型不用生成 Model。
2. 如果数组元素的类型为 `Number` 或者 `Boolean`, 那么需要转为 `NSNumber`。
3. Model 中的枚举类型全部对应到 `NSString *`。

>生成示例：

```objective-c

@property (nonatomic, copy) NSString *userName;
@property (nonatomic, assign) CGFloat count;
@property (nonatomic, assign) BOOL isReady;
@property (nonatomic, strong) HTAuthor *author;
@property (nonatomic, strong) NSArray<HTComment *> *comments;
@property (nonatomic, strong) NSArray<NSNumber *> *ids;

```

### 二、Model 生成规则

1. 只生成自定义数据类型的 Model 文件，文件名为 `前缀 + 数据类型名`，默认前缀为 `HT`，需要生成两个文件，一个是头文件，另外一个是实现文件。例如：NEI 上的类型名为 `Company`，则生成的类型名字 `HTCompany`, 头文件名为 `HTCompany.h`, 实现文件名为 `HTCompany.m`。
2. 如果自定义数据类型的某个属性为可变类型，则忽略该数据类型，即不生成相应的 Model 文件。
3. 枚举类型的生成规则稍有不同，详见 `枚举类型的生成规则`。
4. 每个属性之前加上注释，内容为 NEI 上对应的描述信息。
5. `ResultData` 是约定的应该使用的返回值类型，它包含三个字段：`code(Number)`、`message(String)` 和 `result(Variable)`，其中定义数据类型的时候 `result` 是可变类型，因此不会生成 `ResultData` 的模型文件。在接口中使用该数据类型时，则需要指定 `result` 的类型。

##### `hash` 类型的生成规则

###### 头文件：

```objective-c

// Model 的默认基类
#import "{{namePrefix}}{{modelAbstract}}.h"

// 前向声明所有使用到的 Model
@class {{CustomModel}};

@interface {{namePrefix}}{{类型名}} : {{namePrefix}}{{modelAbstract}}

// NEI 中的描述信息作为该变量的注释
@property (nonatomic, {{修饰符}}) {{类型}} [*]{{属性名}};

@end

```

###### 实现文件：

```objective-c

#import "{{namePrefix}}{{类型名}}.h"

@implementation {{类型名}}

+ (NSDictionary *)customTypePropertyDic {
    // 例如：return @{@"author" : @"HTAuthor", @"comments" : @"HTComment"};
    return @{@"{{自定义类型的key}}" : @"{{namePrefix}}{{自定义类型的key的类型}}", ......};
}

+ (NSArray *)baseTypePropertyList {
    // 例如：return @[@"title", @"body"];
    return @{@"{{基本类型的key}}", @"{{基本类型的key}}", ......};
}

@end

```

>提示：可以看出，所有的属性都会分布在上述两个方法中

##### 枚举类型的生成规则

###### 头文件：

```objective-c

// 固定写死
#import <Foundation/Foundation.h>

// NEI 中的描述信息
// 循环输出所有枚举项
extern NSString * const {{namePrefix}}{{类型名}}{{枚举的 key1}};
extern NSString * const {{namePrefix}}{{类型名}}{{枚举的 key2}};
......

```

###### 实现文件：

```objective-c

// 固定写死
#import "Enum.h"

// NEI 中的描述信息
// 循环输出所有枚举项
NSString * const {{namePrefix}}{{类型名}}{{枚举的 key1}} = @"{{枚举的 key1 的值}}";
NSString * const {{namePrefix}}{{类型名}}{{枚举的 key2}} = @"{{枚举的 key2 的值}}";
......

```

#### 不支持的情形

NEI 定义中不包括字典类型( `Hash` 表)、`NSDate` 类型，不需要额外处理。字典类型一定会组装成为一个 Model; `NSDate` 会由 `Number` 或者 `String` 来表达。


### 三、Request 生成规则

1. 命名规则同 Model。例如：NEI 上的接口类名为 `CommentRequest`，则生成的类型名字 `HTCommentRequest`, 头文件名为 `HTCommentRequest.h`, 实现文件名为 `HTCommentRequest.m`。
2. 接口的输入参数作为 `Request` 类的属性，每一个参数作为 `Request` 类的一个属性，规则与 **`NEI 数据类型转 Model`** 相同, 具体可以参见第一部分的内容。

###### 头文件：

```objective-c

// 默认基类
#import "{{namePrefix}}{{reqAbstract}}.h"

// 前向声明所有使用到的 Model
@class {{CustomModel}};

@interface {{namePrefix}}{{接口类名}} : {{namePrefix}}{{reqAbstract}}

// NEI 中的描述信息作为该变量的注释
// 依次输出所有的输入参数
@property (nonatomic, {{修饰符}}) {{类型}} [*]{{属性名}};
......

@end

```

###### 实现文件：

```objective-c

// 该请求的头文件
#import "{{namePrefix}}{{接口类名}}.h"
// 固定写死
#import "NSObject+HTModel.h"
// 返回值中需要用到的 Model 的头文件，带前缀
#import "{{CustomModel}}.h"

@implementation {{namePrefix}}{{接口类名}}

+ (RKRequestMethod)requestMethod {
    // MethodType 的所有可能取值为： GET、POST、DELETE、HEAD、PUT
    return RKRequestMethod{{MethodType}};
}

+ (NSString *)requestUrl {
    return @"{{requestUrl}}";
}

// responseMapping 和 keyPath 方法的实现逻辑如下：
//  1. 如果输出参数只有一条，如果它的类型为自定义类型，或者它是数组类型且数组元素的类型为自定义类型，则：
//     a. responseMapping 方法返回：[{{namePrefix}}{{自定义类型名}} defaultResponseMapping]
//     b. keyPath 方法返回：@"{{参数名}}"
//
//  2. 如果输出参数是自定义类型 ResultData，则：
//     a. responseMapping 方法返回：[{{namePrefix}}{{result 字段的类型名}} defaultResponseMapping]
//     b. keyPath 方法返回：@"result"
//
//  3. 如果输出参数是一个导入的自定义类型（但不是 ResultData），则：
//     a. responseMapping 方法返回：[{{namePrefix}}{{自定义类型名}} defaultResponseMapping]
//     b. keyPath 方法返回：nil
//
//  4. 如果输出参数有多个并且只有一个自定义类型，则：（相当于 2，不推荐使用）
//     a. responseMapping 方法返回：[{{namePrefix}}{{自定义类型名}} defaultResponseMapping]
//     b. keyPath 方法返回：@"{{自定义类型所对应的属性名}}"
//
//  5. 其他情况：
//     a. responseMapping 方法返回：nil
//     b. keyPath 方法返回：nil
//
// 提示：一个应用的同一套接口，应该从 1、2 或者 3 中挑选出一套规则来进行处理, 并且只应用其中的一套规则
+ (RKMapping *)responseMapping {
    return {{见上述说明}};
}

+ (NSString *)keyPath {
    return {{见上述说明}};
}

// 该方法描述输入参数信息
- (NSDictionary *)requestParams {
    // 如果输入参数是一个导入类型，需要给该类型生成一个属性名，目前实现为该类型的首字母小写形式。
    // 即如果类型为 Address，则 reqAutoAddedName 的值为 address，最终内容为：
    // NSDictionary *dic = [self.address ht_modelToJSONObject]
    // 其他情况 reqAutoAddedName 没有值
    NSDictionary *dic = [self{%if reqAutoAddedName %}.{{reqAutoAddedName}}{%endif%} ht_modelToJSONObject];
    if ([dic isKindOfClass:[NSDictionary class]] && [dic count] > 0) {
        return dic;
    }

    return nil;
}

@end

```

### 四、枚举和公共头文件

1. 枚举统一放在一个文件中描述，头文件为 `HTModelEnums.h`，实现文件为 `HTModelEnums.m`，HT 为默认前缀。
2. 生成两个头文件：`HTModels.h` 和 `HTRequests.h`，前者包含所有生成的 Model 的头文件，后者包括所有生成的 `Request` 的头文件。


### 完
