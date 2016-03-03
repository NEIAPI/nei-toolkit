//
//  Enum.m
//
//  Created by {{conf.author}}
//
//  Auto build by NEI Builder

#import "{{conf.prefix}}ModelEnums.h"

{% for enu in enums -%}
/**
 * {{enu.description}}
 */
{% for attr in enu.pairs -%}
// {{attr.desc}}
NSString * const {{conf.prefix}}{{enu.name}}{{attr.key}} = @"{{attr.value}}";
{%- endfor %}
{% endfor %}