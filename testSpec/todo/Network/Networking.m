//
//  Networking.m
//  
//
//  Created by Bai tianyu on 1/15/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "Networking.h"
#import "HTNetworking.h"
#import <objc/runtime.h>

static NSString * const kDevBaseURL = @"";
static NSString * const kPreBaseURL = @"";
static NSString * const kOnlineBaseURL = @"";

@implementation Networking

+ (NetworkHostEnv)hostEnv {
    NSDictionary* infoDict = [[NSBundle mainBundle] infoDictionary];
    NSString* version = [infoDict objectForKey:@"UseHostEnvironment"];

    if ([version isEqualToString:@"online"]) {
        return NetworkOnlineEnv;
    } else if ([version isEqualToString:@"dev"]) {
        return NetworkDevEnv;
    } else if ([version isEqualToString:@"pre"]) {
        return NetworkPreEnv;
    }
    
    return NetworkOnlineEnv;
}

+ (void)NetworkingInit {
    NSURL *baseURL = [NSURL URLWithString:[self getBaseUrlString]];
    RKObjectManager *manager = HTNetworkingInit(baseURL);
    manager.requestSerializationMIMEType = RKMIMETypeJSON;
}

+ (NSString *)getBaseUrlString {
    switch ([self hostEnv]) {
        case NetworkDevEnv:
            return kDevBaseURL;
            break;
        case NetworkPreEnv:
            return kPreBaseURL;
            break;
        case NetworkOnlineEnv:
            return kOnlineBaseURL;
            break;
    }
}

@end
