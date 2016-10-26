# JavaBean文件模板

```java
/**
{{prettifyComment datatype.description}}
 */
public class {{datatype.name}} {
    {{#each datatype.fields}}
    {{#if description}}
    // {{noLineBreak description}}
    {{/if}}
    private {{typeName this}} {{name}};
    {{/each}}
    {{! getter}}
    {{#each datatype.fields}}

    public {{typeName this}} get{{upperFirst name}}() {
        return {{name}};
    }
    {{/each}}
    {{! setter}}
    {{#each datatype.fields}}

    public void set{{upperFirst name}} ({{typeName this}} {{name}}) {
        this.{{name}} = {{name}};
    }
    {{/each}}
}
```

>说明: prettifyComment、noLineBreak、typeName、upperFirst 都是 handlebars 的辅助函数, 具体功能请查看文档: [Handlebars 辅助函数集说明](./Handlebars辅助函数集.md)