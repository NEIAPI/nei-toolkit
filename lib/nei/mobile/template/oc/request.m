//
//  {{conf.prefix}}{{req.name}}Request.m
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import "{{conf.prefix}}{{req.name}}Request.h"
#import "{{conf.prefix}}{{req.model}}.h"

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
    return [{{conf.prefix}}{{req.model}} defaultResponseMapping];
}

+ (NSString *)keyPath {
    return {% if req.output %}@"{{req.output}}" {% else %} nil {% endif%};
}

@end
