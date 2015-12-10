//
//  {{type.name}}.java
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.mPkg}};

/**
 *  {{type.description}}
 */
public interface {{type.name}} {
    {% for attr in type.attrs %}
    {%- if attr.description -%}
    /**
     *  {{attr.description}}
     */
    {%- endif -%}
    public static final String {{attr.vkey}} = "{{attr.name}}";
    {% endfor %}
}
