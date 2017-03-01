//
//  GlobalEnums.h
//  JustTest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 红点的类型，用于未读消息这类场景。
 
 @constant BadgeTypeText 带有文字的圆点

 @constant BadgeTypeDot 不含有文字的圆点
 */
typedef NS_ENUM(NSUInteger, BadgeType) {
    /// 带有文字的圆点
    BadgeTypeText,
    /// 不含有文字的圆点
    BadgeTypeDot,
};

/**
 状态栏样式
 
 @constant StatusBarStyleInvalid      无效
 @constant StatusBarStyleDefault      默认样式：黑色
 @constant StatusBarStyleLightContent 白色
 */
typedef NS_ENUM(NSInteger, StatusBarStyle) {
    /// 无效
    StatusBarStyleInvalid = 0,
    /// 黑色
    StatusBarStyleDefault,
    /// 白色
    StatusBarStyleLightContent,
};


@interface GlobalEnums : NSObject

@end
