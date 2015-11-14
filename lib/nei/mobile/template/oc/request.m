//
//  {{conf.prefix}}{{req.name}}Request.m
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

#import "{{conf.prefix}}{{req.name}}Request.h"
{% for model in req.models %}
#import "{{conf.prefix}}{{model.name}}.h"
{% endfor %}

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

+ (RKResponseDescriptor *)responseDescriptor {
    RKObjectMapping *mapping = [RKObjectMapping mappingForClass:[HTArticle class]];
    [mapping addAttributeMappingsFromArray:@[@"title", @"body", @"publicationDate"]];

    RKObjectMapping *relationShipMapping = [RKObjectMapping mappingForClass:[HTAuthor class]];
    [relationShipMapping addAttributeMappingsFromArray:@[@"name", @"email"]];

    [mapping addPropertyMapping:[RKRelationshipMapping relationshipMappingFromKeyPath:@"author"
                                                                            toKeyPath:@"author"
                                                                          withMapping:relationShipMapping]];

    RKResponseDescriptor *responseDescriptor = [RKResponseDescriptor responseDescriptorWithMapping:mapping method:[self requestMethod] pathPattern:[self requestUrl] keyPath:@"data" statusCodes:RKStatusCodeIndexSetForClass(RKStatusCodeClassSuccessful)];

    return responseDescriptor;
}

@end
