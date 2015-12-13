# Android 客户端代码生成规则

##### 为表达简洁起见，本文作如下说明及约定：

1. 位于 `{{` 和 `}}` 之间的是可替换内容。
2. 本文代码中的注释是辅助说明，和最终生成的代码无关。
3. `{{appPackage}}`，应用包名，通过命令行参数传入，默认值为 `com.netease`。
4. `{{modelPackage}}`，模型的相对包名，通过命令行参数传入，默认值为 `hthttp.model`。
5. `{{reqPackage}}`，请求的相对包名，通过命令行参数传入，默认值为 `hthttp.httptask`。
6. `{{reqAbstract}}`，请求的基类，通过命令行参数传入。
7. `{{modelAbstract}}`，模型的基类，通过命令行参数传入。

### 一、NEI 中的数据类型和 Java 语言中的数据类型的对应关系
| NEI 数据类型  | Java 数据类型 | 说明 |
| :--- | :--- | :---
| `String` | `String` | / |
| `Number` | `double` | 如果数组元素的类型为 `Number`，则为 `Double` |
| `Boolean` | `boolean` | 如果数组元素的类型为 `Boolean`，则为 `Boolean` |
| `Array` | `List` | 导入包 `java.util.List` |
| `Variable` | `Object` | 尽量避免可变类型 |
| `自定义类型` | `同名自定义类型` | 工具会生成自定义数据类型的 Model 文件 |

### 二、Model 生成规则

1. 只生成自定义数据类型的 Model 文件，文件名为数据类型名，路径为包名。例如：NEI 上的类型名为 `Company`，则生成的类型名字 `Company`, 文件名为 `Company.java`，默认包名为`com.netease.hthttp.model`，文件位置为 `com/netease/hthttp/model/Company.java`。
2. 如果自定义数据类型的某个属性为可变类型，则忽略该数据类型，即不生成相应的 Model 文件。
3. 属性有 `getter` 和 `setter` 方法。如果类型是 `Boolean`，则 `getter` 的方法名直接使用属性名。
4. 属性的修饰符为 `private`，`getter` 和 `setter` 的修饰符是 `public`。
5. 属性如果是枚举类型，则将其转换为 `String` 类型（待测试）。
6. 枚举类型的生成规则稍有不同，详见 `枚举类型的生成规则`。
7. 每个属性之前加上注释，内容为 NEI 上对应的描述信息。

##### `hash` 类型的生成规则

```java

// 文件包名
package {{appPackage}}.{{modelPackage}};

// Model 基类，固定写死
import com.netease.hthttp.model.HTBaseModel;
// 如果有数组类型，就导入下面这个包
import java.util.List;

public class {{数据类型名}} extends HTBaseModel {
    // 每个属性对应 NEI 上该数据类型的属性，修饰符为 private
    // 每个属性的前面加上注释，内容为 NEI 上该属性的描述信息
    private double id;
    private boolean isMine;
    private String name;
    // 因为所有的 Model 都在同个目录中，所以不需要导入 CustomModel
    private CustomModel customModel;
    // 其他情况：List<Double>, List<Boolean>, List<Author>, etc...
    // 注意：数组元素的类型如果是数字或者布尔，则首字母大写
    private List<String> array;
    // day 在 NEI 中定义为枚举类型，将其转换为 `String`
    private String day;

    // getter 方法，修饰符为 public
    public double getId() {
        return id;
    }

    // 布尔类型的 getter 方法
    public boolean isMine() {
        return isMine;
    }

    ...

    // setter 方法，修饰符为 public，返回类型为 void
    public void setId(double id) {
        this.id = id;
    }

    ...
}

```

##### 枚举类型的生成规则

```java

package {{appPackage}}.{{modelPackage}};

public interface {{数据类型名}} {
    // 每个属性对应 NEI 上该数据类型的属性，修饰符为 public static final，类型为 String
    public static final String MONDAY = "monday";
}

```

>注意: 定义枚举类型时使用 `interface`，而不是 `class`，也不是 `enum`。

#### 不支持的 Case

NEI 定义中不包括字典类型(各种`Map`、`SparseArray`)、`Date` 类型，不需要额外处理。字典类型一定会组装成为一个 Model; `Date` 会由 `Number` 或者 `String` 来表达。

### 三、HttpTask 生成规则

1. HttpTask 类名为 NEI 中的接口名加 `HttpTask` 的形式，如 NEI 上的接口名称为 `Login`，则类名为 `LoginHttpTask`。
2. 默认包名为 ${应用包名}.hthttp.httptask，文件位置为 ${应用包名指定的目录}/hthttp/httptask，其中 `hthttp.httptask` 用户可配置，即命令行传入的 `reqPackage` 参数。
3. 由于在 NEI 中无法定义特殊的文件上传请求，故在此先约定 `put` 请求为文件上传。

##### 非 `put` 请求生成规则

```java

// 包名
package {{appPackage}}.{{reqPackage}};

// 如果输入参数（url 参数或者 header）中有数组类型 `List`, 则导入下面这个包。
import com.alibaba.fastjson.JSONArray;
// 如果输入参数 ( url 参数或者 header ) 中有基本类型 `double` 或者 `boolean`, 则导入下面这个包。
import com.alibaba.fastjson.JSONObject;
// 默认请求基类
import com.netease.hthttp.BaseHttpStringRequestTask;

// 导入需要的包，完整路径，如用到的模型文件等。
import {{customModel}};

public class {{NEI 中定义的请求名}}HttpTask extends BaseHttpStringRequestTask {

    public GetExampleHttpTask(double param1,      // 注释，NEI上的变量描述   /* number 类型的输入 */
                              String param2,      // 注释，NEI上的变量描述   /* string 类型的输入 */
                              Boolean param3,     // 注释，NEI上的变量描述   /* boolean 类型的输入 */
                              InnerModel param4,  // 注释，NEI上的变量描述   /* 自定义类型 类型的输入 */
                              List<String> param5) { // 注释，NEI上的变量描述   /* 数组 类型的输入 */

        /* 请求方法类型 */
        super(HttpMethod.GET);
        /* 在url后面添加参数 */
        mQueryParamsMap.put("param1", Double.toString(param1));
        mQueryParamsMap.put("param2", param2);
        mQueryParamsMap.put("param3", Boolean.toString(param3));
        mQueryParamsMap.put("param4", JSONObject.toJSONString(param4));
        mQueryParamsMap.put("param5", JSONArray.toJSONString(param5));
    }


    /* 请求完整url，不包含url后面的参数 */
    /*
    @Override
    public String getUrl() {
        return "/xhr/mobile/getexample.json";
    }
    */

    /* 请求url，不包含前面的host，不包含url后面的参数 */
    @Override
    protected String getApi() {
        return "/xhr/mobile/getexample.json";
    }


    @Override
    public Class getModelClass() {
        return TestModel.class;
    }
}

```
