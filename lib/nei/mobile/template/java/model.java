//
//  {{type.name}}.java
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.mPkg}};

import com.netease.hthttp.model.HTBaseModel;
{%- for pkg in type.pkgs %}
import {{loop.key}};
{%- endfor %}

/**
 *  {{type.description}}
 */
public class {{type.name}} extends HTBaseModel {
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
    public {{attr.typeName}} {% if attr.typeName === "boolean" %}{{attr.name}}{% else %}get{{attr.capName}}{% endif %}() {
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
