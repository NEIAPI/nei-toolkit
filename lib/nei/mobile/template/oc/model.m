//
//  {{conf.prefix}}{{type.name}}.m
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import "{{conf.prefix}}{{type.name}}.h"

/**
 *  {{type.description}}
 */
@implementation {{conf.prefix}}{{type.name}}

+ (NSDictionary *)customTypePropertyDic {
    return @{{'{'}}{{type.dictStr}}{{'}'}};
}

+ (NSArray *)baseTypePropertyList {
    return @[{{type.baseStr}}];
}

@end