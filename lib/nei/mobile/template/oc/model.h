//
//  {{conf.prefix}}{{type.name}}.h
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import <Foundation/Foundation.h>
{%- if type.hasEnum %}
{{enumStr}}
{%- endif %}

/**
 *  {{type.description}}
 */
@class {{conf.prefix}}{{type.name}};
{%- for kls in type.klses %}
@class {{conf.prefix}}{{kls}};
{%- endfor %}

@interface {{conf.prefix}}{{type.name}} : NSObject
{% for attr in type.props %}
/**
 *  {{attr.description}}
 */
@property (nonatomic, {{attr.refName}}) {{attr.typeName}} {% if !attr.noStar -%}*{%- endif -%}{{attr.name}};
{% endfor %}
@end
