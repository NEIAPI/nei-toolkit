//
//  {{conf.prefix}}{{type.name}}.h
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import "{{conf.model}}.h"
{# pre classes #}
{%- for kls in type.klses %}
@class {{conf.prefix}}{{kls}};
{%- endfor %}

/**
 *  {{type.description}}
 */
@interface {{conf.prefix}}{{type.name}} : {{conf.model}}
{% for attr in type.props %}
/**
 *  {{attr.description}}
 */
@property (nonatomic, {{attr.refName}}) {{attr.typeName}} {% if !attr.noStar -%}*{%- endif -%}{{attr.name}};
{% endfor %}
@end
