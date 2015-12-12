# Android 客户端代码生成规则

##### 为表达简洁起见，本文作如下说明及约定：

1. 位于 `{{` 和 `}}` 之间的是可替换内容。
2. 本文代码中的注释是辅助说明，和最终生成的代码无关。
3. `{{appPackage}}`，应用包名，通过命令行参数传入。
4. `{{modelPackage}}`，模型的相对包名，通过命令行参数传入。
5. `{{reqPackage}}`，请求的相对包名，通过命令行参数传入。
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

1. 只生成自定义数据类型的 Model 文件，文件名为数据类型名，路径为包名，符合 Java 语言规范。
2. 如果自定义数据类型的某个属性为可变类型，则忽略该数据类型，即不生成相应的 Model 文件。
3. 属性有 `getter` 和 `setter` 方法。如果类型是 `Boolean`，则 `getter` 的方法名直接使用属性名。
4. 属性的修饰符为 `private`，`getter` 和 `setter` 的修饰符是 `public`。
5. 属性如果是枚举类型，则将其转换为 `String` 类型（待测试）。
6. 枚举类型的生成规则稍有不同，详见 `枚举类型的生成规则`。
7. 每个属性之前加上注释，内容为 NEI 上对应的描述信息。

##### `hash` 类型的生成规则

```java

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
