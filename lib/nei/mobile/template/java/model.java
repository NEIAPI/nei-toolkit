//
//  {{type.name}}.java
//
//  Created by {{conf.author}}
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.mPkg}};

{%- for pkg in type.pkgs %}
import {{loop.key}};
{%- endfor %}

/**
 *  {{type.description}}
 */
public class {{type.name}} {% if req.baseModel %} extends {{req.baseModel}}{% endif %}{
    {% for attr in type.props %}
    {%- if attr.description -%}
    /**
     *  {{attr.description}}
     */
    {%- endif -%}
    private {{attr.typeName}} {{attr.name}};
    {% endfor -%}
    {# getter #}
    {%- for attr in type.props %}
    public {{attr.typeName}} {% if attr.typeName === "boolean" %}{% if attr.name.substr(0,2)==='is' %}{{attr.name}}{% else %}is{{attr.capName}}{% endif %}{% else %}get{{attr.capName}}{% endif %}() {
        return {{attr.name}};
    }
    {% endfor -%}
    {# setter #}
    {%- for attr in type.props %}
    public void set{{attr.capName}}({{attr.typeName}} {{attr.name}}) {
        this.{{attr.name}} = {{attr.name}};
    }
    {% endfor %}
}
