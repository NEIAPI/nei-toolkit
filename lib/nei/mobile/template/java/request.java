//
//  {{type.name}}.java
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.htPkg}};

public class {{req.name}} extends {{conf.base}} {

    public {{req.name}}(
    {%- if req.inputs.length > 0 -%}
    {%- for input in req.inputs -%}
    {{input.whiteSpace}}{{input.typeName}} {{input.name}}{% if loop.last%}) {{'{'}}{% else %},{% endif %}{% if input.description %} // {{input.description}} {% endif %}
    {%- endfor %}{% else %}{{') {'}}{% endif %}
        super(Request.Method.{{req.method}});

    }
}
