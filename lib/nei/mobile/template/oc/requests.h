//
//  {{conf.prefix}}{{conf.rheader}}.h
//
//  Created by {{conf.author}}
//
//  Auto build by NEI Builder
{% for it in list %}
#import "{{conf.prefix}}{{it}}.h"
{%- endfor %}
