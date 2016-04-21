//
//  {{conf.prefix}}{{type.name}}.m
//
//  Created by {{conf.author}}
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