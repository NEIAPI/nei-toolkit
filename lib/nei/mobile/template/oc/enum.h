//
//  Enum.h
//
//  Created by {{conf.author}}
//
//  Auto build by NEI Builder

#import <Foundation/Foundation.h>

{% for enu in enums -%}
/**
 * {{enu.description}}
 */
{% for attr in enu.pairs -%}
// {{attr.desc}}
extern NSString * const {{conf.prefix}}{{enu.name}}{{attr.key}};
{%- endfor %}
{% endfor %}