//
//  Enum.m
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
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