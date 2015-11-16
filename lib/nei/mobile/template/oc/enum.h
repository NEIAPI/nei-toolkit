//
//  Enum.h
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

{% for enu in enums -%}
/**
 * {{enu.description}}
 */
typedef NS_ENUM(NSInteger, {{conf.prefix}}{{enu.name}}) {
    {%- for attr in enu.pairs %}
    // {{attr.desc}}
    {{attr.key}} = {{attr.value}}{% if !loop.last %},{% endif -%}
    {%- endfor %}
};
{% endfor %}

