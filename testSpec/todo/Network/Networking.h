//
//  Networking.h
//  
//
//  Created by Bai tianyu on 1/15/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>

/*!
 一般 App 有三种服务器环境
 
 @NetworkDevEnv     开发环境
 @NetworkOnlineEnv  线上环境
 @NetworkPreEnv     预发布环境
 */
typedef NS_ENUM(NSInteger, NetworkHostEnv) {
    /// 开发环境
    NetworkDevEnv,
    /// 线上环境
    NetworkOnlineEnv,
    /// 预发布环境
    NetworkPreEnv
};


@interface Networking : NSObject

/// 初始化网络配置
+ (void)NetworkingInit;
/// 获取当前服务器环境
+ (NetworkHostEnv)hostEnv;

@end
