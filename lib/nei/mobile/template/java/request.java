//
//  {{req.name}}.java
//
//  Created by {{conf.author}}
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.htPkg}};

{% for pkg in req.pkgs -%}
import {{pkg}};
{% endfor %}
import com.netease.hearttouch.hthttp2.core.HTConnection;
/**
 *  {{req.desc}}
 */
public class {{req.name}} extends {{req.baseClass}} {

    public {{req.name}}(
    {%- if req.inputs.length > 0 -%}
    {%- for input in req.inputs -%}
    {{input.whiteSpace}}{{input.typeName}} {{input.name}}{% if loop.last%}) {{'{'}}{% else %},{% endif %}{% if input.description %} // {{input.description}} {% endif %}
    {%- endfor %}{% else %}{{') {'}}{% endif %}

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
    public String getApi() {
        return {% if req.hasHost %}null{% else %}"{{req.path}}"{% endif %};
    }

    @Override
    public String getMethod(){
        return HttpMethod.{{req.method}};
    }

    public Class getModelClass() {
        return {{req.outputModel}};
    }
}
