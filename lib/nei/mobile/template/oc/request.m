//
//  {{conf.prefix}}{{req.className}}Request.m
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import "{{conf.prefix}}{{req.className}}.h"
#import "NSObject+HTModel.h"
{%- for model in req.reqModels %}
#import "{{conf.prefix}}{{model}}.h"
{%- endfor %}
{% if req.resModel && req.reqModels.indexOf(req.resModel) == -1 %}#import "{{conf.prefix}}{{req.resModel}}.h"{% endif%}

/**
 *  name: {{req.name}}
 *  description: {{req.description}}
 */
@implementation {{conf.prefix}}{{req.className}}

+ (RKRequestMethod)requestMethod {
    return RKRequestMethod{{req.method}};
}

+ (NSString *)requestUrl {
    return @"{{req.url}}";
}

+ (RKMapping *)responseMapping {
    return {% if req.resModel %}[{{conf.prefix}}{{req.resModel}} defaultResponseMapping]{% else %}nil{% endif %};
}

+ (NSString *)keyPath {
    return {% if req.resName %}@"{{req.resName}}"{% else %}nil{% endif%};
}

- (NSDictionary *)requestParams {
    NSDictionary *dic = [self{% if req.reqAutoAddedName %}.{{req.reqAutoAddedName}}{%endif%} ht_modelToJSONObject{% if req.reqVarHeaders.length %}:[self headerPropertyList]{% endif %}];
    if ([dic isKindOfClass:[NSDictionary class]] && [dic count] > 0) {
        return dic;
    }

    return nil;
}
{% if req.reqVarHeaders.length %}
- (NSArray *)headerPropertyList {
    return @[{% for header in req.reqVarHeaders %}@"{{header.varName}}"{% if !loop.last%}, {% endif %}{% endfor %}];
}
{% endif -%}
{% if req.reqConstHeaders.length || req.reqVarHeaders.length %}
- (NSDictionary *)requestHeaderFieldValueDictionary {
    NSMutableDictionary *dic = [NSMutableDictionary dictionary];
    {%- for header in req.reqConstHeaders %}
    [dic setObject:@"{{header.value}}" forKey:@"{{header.key}}"];{% if header.desc %} // {{header.desc}} {% endif -%}
    {%- endfor %}
    {% for header in req.reqVarHeaders %}
    if (nil != _{{header.varName}}) {
        [dic setObject:_{{header.varName}} forKey:@"{{header.key}}"];
    }
    {% endfor %}
    return dic;
}
{% endif %}

@end
