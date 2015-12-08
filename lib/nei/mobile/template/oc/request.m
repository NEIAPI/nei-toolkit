//
//  {{conf.prefix}}{{req.name}}Request.m
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import "{{conf.prefix}}{{req.name}}Request.h"
{% if req.resModel %}#import "{{conf.prefix}}{{req.resModel}}.h"{% endif%}

/**
 *  {{req.description}}
 */
@implementation {{conf.prefix}}{{req.name}}Request

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
    NSDictionary *dic = [self{% if req.reqAutoAddedName %}.{{req.reqAutoAddedName}}{%endif%} ht_modelToJSONObject];
    if ([dic isKindOfClass:[NSDictionary class]] && [dic count] > 0) {
        return dic;
    }

    return nil;
}

@end
