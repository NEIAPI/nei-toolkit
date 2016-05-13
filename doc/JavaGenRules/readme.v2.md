# Android 客户端代码生成规则

##### 为表达简洁起见，本文作如下说明及约定：

1. 位于 `{{` 和 `}}` 之间的是可替换内容。
2. 本文代码中的注释是辅助说明，和最终生成的代码无关。
3. `{{appPackage}}`，应用包名，通过命令行参数传入，默认值为 `com.netease`。
4. `{{modelPackage}}`，模型的相对包名，通过命令行参数传入，默认值为 `hthttp.model`。
5. `{{reqPackage}}`，请求的相对包名，通过命令行参数传入，默认值为 `hthttp.request`。
6. `{{reqAbstract}}`，请求的基类，全路径，通过命令行参数传入。该参数必选，若不传入该参数，则不会生成请求。
7. `{{modelAbstract}}`，模型的基类，通过命令行参数传入，无默认值。

### 一、NEI 中的数据类型和 Java 语言中的数据类型的对应关系
| NEI 数据类型  | Java 数据类型 | 说明 |
| :--- | :--- | :---
| `String` | `String` | / |
| `Integer ` | `Integer` | 整形 |
| `Float ` | `Float` | 如果数组元素的类型为 `Float `，则为 `Float ` |
| `Double ` | `Double ` | 如果数组元素的类型为 `Double `，则为 `Double ` |
| `Long ` | `Long` | 如果数组元素的类型为 `Long `，则为 `Long ` |
| `Boolean` | `Boolean ` | 如果数组元素的类型为 `Boolean`，则为 `Boolean` |
| `Array` | `dataType[]` | dataType为数值或布尔值时，都是大写字母开头，如Integer[]、Long[] |
| `Variable` | `Object` | 尽量避免可变类型 |
| `自定义类型` | `同名自定义类型` | 工具会生成自定义数据类型的 Model 文件 |

### 二、Model 生成规则

1. 只生成自定义数据类型的 Model 文件，文件名为数据类型名，路径为包名。例如：NEI 上的类型名为 `Company`，则生成的类型名字 `Company`，文件名为 `Company.java`，默认包名为`com.netease.hthttp.model`，文件位置为 `com/netease/hthttp/model/Company.java`。
2. 如果自定义数据类型的某个属性为可变类型，则忽略该数据类型，即不生成相应的 Model 文件。
3. 若字段类型为自定义数据类型的数组，如 `CustomModel[] `，只需要为`CustomModel `生成 Model 文件，`CustomModel[]`则不需要生成。多维数组一样处理。
4. 属性有 `getter` 和 `setter` 方法。
5. 属性的修饰符为 `private`，`getter` 和 `setter` 的修饰符是 `public`。
6. 属性如果是枚举类型，则将其转换为 `String` 类型。
7. 枚举类型的生成规则稍有不同，详见 `枚举类型的生成规则`。
8. 每个属性之前加上注释，内容为 NEI 上对应的描述信息。
9. `ResultData` 是约定的应该使用的返回值类型，它包含三个字段：`code(Integer)`、`message(String)` 和 `result(Variable)`，其中定义数据类型的时候 `result` 是可变类型，因此不会生成 `ResultData` 的模型文件。在接口中使用该数据类型时，则需要指定 `result` 的类型。

##### `hash` 类型的生成规则

```java

// 文件包名
package {{appPackage}}.{{modelPackage}};

public class {{数据类型名}} {
    // 每个属性对应 NEI 上该数据类型的属性，修饰符为 private
    // 每个属性的前面加上注释，内容为 NEI 上该属性的描述信息
    private Integer id;
    private Boolean isMine;
    private Boolean hasMore;
    private String name;
    // 自定义类型的字段按下述规则处理:
    // 因为所有的 Model 都在同个目录中，所以不需要导入 CustomModel
    // a. 如果 CustomModel 本身是数组类型, 则:
    //  1. 如果数组元素是基本类型 String(Integer, Boolean同理), 则写作: private String[] customModelFieldName;
    //  2. 否则按照数组元素的类型, 递归执行上述规则.
    // b. 如果 CustomModel 是哈希对象, 则写作: private CustomModel customModelFieldName;

    // 如果字段是数组类型的, 按上面 CustomModel 的规则 a 处理
    // 注意：数组元素的类型如果是数字或者布尔，则首字母大写
    private String[] array;
    // 如果数组大于一维, 则按上面 CustomModel 的规则 a 处理

    // day 在 NEI 中定义为枚举类型，将其转换为 `String`
    private String day;

    // getter 方法，修饰符为 public
    public Integer getId() {
        return id;
    }

    // 布尔类型的 getter 方法
    public Boolean getIsMine() {
        return isMine;
    }
    
    public Boolean getHasMore() {
        return hasMore;
    }

    ...

    // setter 方法，修饰符为 public，返回类型为 void
    public void setId(Integer id) {
        this.id = id;
    }

    ...
}

```

##### 枚举类型的生成规则

```java

package {{appPackage}}.{{modelPackage}};

public interface {{数据类型名}} {
    // 每个属性对应 NEI 上该数据类型的属性，修饰符应该为 public static final（interface 中，可省略），类型为 String
    
    // 依次输出所有枚举项
    String MONDAY = "monday";
    String TUESDAY = "tuesday";
    
    ......
}

```

>注意: 定义枚举类型时使用 `interface`，而不是 `class`，也不是 `enum`，而 `interface` 字段默认是 `public static final` 的，所以生成的代码可以不加修饰符。

#### 不支持的情形

NEI 定义中不包括字典类型(各种`Map`、`SparseArray`)、`Date` 类型，不需要额外处理。字典类型一定会组装成为一个 Model; `Date` 会由 `Long` 或者 `String` 来表达。

### 三、Request 生成规则

1. `Request` 类名为 NEI 中的接口类名加 `Request ` 的形式，如 NEI 上的接口类名为 `Login`，则类名为 `LoginRequest`。
2. 默认包名为 `{{appPackage}}.hthttp.request`，文件位置为 `{{appPackage目录}}/hthttp/request`，其中 `hthttp.request` 用户可配置，即命令行传入的 `reqPackage` 参数。
3. `Request` 的基类(需继承自 `FormBodyRequest` 或 `JSONBodyRequest` 的类等)用户必须进行配置，即通过命令行传入的 `reqAbstract` 参数指定，且参数值必须是基类的全路径。如基类是 `XXBaseRequest`，则参数值为 `com.netease.XX.XXBaseRequest`。若该参数未配置，则不生成相关接口的 `Request `类。
4. 由于在 NEI 中无法定义特殊的文件上传请求，故在此先约定 `put` 请求为文件上传。
5. `Request`的参数，推荐是基本数据类型。若传入的参数是自定义类型 `CustomModel `，则生成的代码会调用 `toString()`方法，因此需要用户重写 `toString()` 方法；若传入的参数是数组，则调用 `com.netease.hearttouch.hthttp.utils.ArrayUtil ` 包中的 `ArrayUtil.parseArrayToString()` 方法对数组进行转换。

##### 普通请求生成规则

```java

// 包名
package {{appPackage}}.{{reqPackage}};

// 导入用户自定义的基类的包 `{{reqAbstract}}`，且值为全路径。如基类的包为 `com.netease.XX.XXBaseRequest`，
//则基类为路径以 `.` 号分割的最后一个名称 `XXBaseRequest`。
import {{reqAbstract}};

// 固定要导入的包
import com.netease.hearttouch.hthttp.HttpMethod;
// 如果输入参数（url 参数或者 header）中有数组类型 `dataType[]`, 则导入下面这个包。
iimport java.util.Arrays;

// 其他需要导入的包，完整路径，如用到的模型文件等。
import {{CustomModel}};

// `请求类名` 在 NEI 中定义
public class {{请求类名}}Request extends {{XXBaseRequest}} {
    
    //如果输入参数是一个导入的类型，则参数名称为"导入类型名称的首字母小写形式"
    public {{请求类名}}Request(Double param1, // 注释，NEI上的变量描述，下同
                               String param2,
                               Boolean param3,
                               CustomModel param4,
                               String[] param5) {

        super();
        // paramContainer，参数容器。
        // GET 和 HEAD 请求，参数添加到 queryMap 对象中。
        // POST 和 DELETE 请求，参数添加到 bodyMap 对象中。
        // 请求头参数添加到 headMap 对象中。注意，请求头的值类型只支持 String 类型。
        {{paramContainer}}.put("param1", param1.toString());
        {{paramContainer}}.put("param2", param2);
        {{paramContainer}}.put("param3", param3.toString());
        //自定义数据类型，用户可以重写toString()方法
        {{paramContainer}}.put("param4", param4.toString());
        // 需要对数组进行转换
        {{paramContainer}}.put("param5", Arrays.deepToString(param5));
    }

    // getUrl 和 getApi 方法只实现一个。
    // 如果 NEI 中定义的 url 是完整的，即包含了 host 信息，只实现 getUrl 方法，否则实现 getApi 方法。
    @Override
    public String getUrl() {
        return {{requestUrl}};
    }

    @Override
    protected String getApi() {
        return {{requestUrl}};
    }

   // MethodType，请求方法类型，所有可能取值为：GET、POST、HEAD、DELETE 和 PUT
    @Override
    public  String getMethod(){
        return HttpMethod.POST;
    }

    // 根据返回值的类型，需返回不同的值，规则如下：
    // 1. 如果没有定义返回值，则返回: null。
    // 2. 如果返回值为一个导入的 `ResultData`（即只有一个可变类型字段），根据可变类型字段可变类型字段的类型，则返回：
    //    a. 如果可变类型字段为 String 类型，则返回 String.class。
    //    b. 如果可变类型字段为 Integer 类型，则返回 Integer.class。
    //    c. 如果可变类型字段为 Long 类型，则返回 Long.class。
    //    d. 如果可变类型字段为 Float 类型，则返回 Float.class。
    //    e. 如果可变类型字段为 Double 类型，则返回 Double.class。
    //    f. 如果可变类型字段为 Boolean 类型，则返回 Boolean.class。
    //    g. 如果可变类型字段为自定义类型 CustomModel，则返回 CustomModel.class。
    //    h. 如果可变类型字段是数组，则:
    //      i.  如果数组元素是 String，Integer（或其他数值类型），Boolean 或者 自定义类型 CustomModel，则分别返回 String[].class，Integer[].class，Boolean[].class 或者 CustomModel[].class。
    //      ii. 如果数组元素是数组(二维数组)，则根据二维数组的元素类型，递归执行规则 h。例如，如果二维数组的元素是 String, 则返回 String[][].class。
    // 3. 如果返回值为一个导入的自定义类型 CustomModel（但不是 ResultData），则返回：CustomModel.class。
    // 4. 如果返回值只有一个字段，则根据它的类型，按规则 2 执行。
    // 5. 如果返回值的字段个数大于 1, 则返回 `Object.class`。
    // 6. 其他情况返回：null。
    @Override
    public Class getModelClass() {
        return {{返回信息见上述说明}};
    }
}

```
#### 不支持的情形
目前暂时不提供文件上传请求和文件下载请求的 `Request `类的自动生成。