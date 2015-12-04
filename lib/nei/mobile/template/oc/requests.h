//
//  {{conf.prefix}}{{conf.rheader}}.h
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder
{% for it in list %}
#import "{{conf.prefix}}{{it}}.h"
{%- endfor %}
