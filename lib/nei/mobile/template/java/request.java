//
//  {{req.name}}.java
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.htPkg}};

{% for pkg in req.pkgs -%}
import {{pkg}};
{% endfor %}
/**
 *  {{req.desc}}
 */
public class {{req.name}} extends {{req.baseClass}} {

    public {{req.name}}(
    {%- if req.inputs.length > 0 -%}
    {%- for input in req.inputs -%}
    {{input.whiteSpace}}{{input.typeName}} {{input.name}}{% if loop.last%}) {{'{'}}{% else %},{% endif %}{% if input.description %} // {{input.description}} {% endif %}
    {%- endfor %}{% else %}{{') {'}}{% endif %}
        super(HttpMethod.{{req.method}});

        {% for param in req.params -%}
        {{param.container}}.put("{{param.key}}", {{param.valueExp}});{% if param.desc %} // {{param.desc}} {% endif %}
        {% endfor %}
    }

    {%- if req.hasHost %}
    @Override
    public String getUrl() {
        return "{{req.path}}";
    }
    {%- endif %}

    @Override
    protected String getApi() {
        return {% if req.hasHost %}null{% else %}"{{req.path}}"{% endif %};
    }

    public Class getModelClass() {
        return {{req.outputModel}};
    }
}
