# 一步一步教你如何愉快地生成 JavaBean 文件

## 先创建规范

1. 在 [NEI 平台](http://nei.netease.com) 上点击“工程规范 -> 新建规范”，输入规范名称，比如 TodoSpec，点击“保存”

2. 点击“工程结构”，新建一个文件，文件名为 `{{datatype.name}}`，在右边选择“数据模型列表填充”

3. 将 [JavaBean 文件的示例模板](./JavaBean文件的示例模板.md)中的内容复制到新创建的文件内容中

## 然后创建工程

1. 点击“项目管理”，在某个项目组下创建一个项目，比如 TodoWeb

2. 在刚才创建的 TodoWeb 项目下，点击“资源管理 -> 数据模型 -> 新建模型”，输入名称 “Todo”，输入它拥有的字段名称及类型，然后点击“保存”

3. 点击“工具设置”，在“WEB工程规范”一栏的工程规范处，选择之前创建的规范“TodoSpec”

4. 复制“工具标识”处的构建命令

## 然后安装构建工具

运行下面的命令安装:

```bash
npm install -g nei
```

## 运行构建工程的命令

运行之前在“工具标识”处复制的命令，可以通过 -o 参数指定文件的输出目录

```bash
nei build -k xxxxxxx -o ./todobean
```

在 todobean 目录就可以看到新生成的 JavaBean 文件了，比如下面这样的文件:

```java
/**
 * Todo模型
 */
public class Todo {
    // todo id
    private Float id;
    // todo 的内容
    private String text;
    // 是否完成
    private Number[] completed;

    public Float getId {
        return id;
    }

    public String getText {
        return text;
    }

    public Number[] getCompleted {
        return completed;
    }

    public void setId {
        this.id = id;
    }

    public void setText {
        this.text = text;
    }

    public void setCompleted {
        this.completed = completed;
    }
}
```

