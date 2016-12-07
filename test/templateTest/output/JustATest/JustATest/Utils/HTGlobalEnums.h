//
//  HTGlobalEnums.h
//  JustATest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 红点的类型，用于未读消息这类场景。
 
 @constant HTBadgeTypeText 带有文字的圆点

 @constant HTBadgeTypeDot 不含有文字的圆点
 */
typedef NS_ENUM(NSUInteger, HTBadgeType) {
    /// 带有文字的圆点
    HTBadgeTypeText,
    /// 不含有文字的圆点
    HTBadgeTypeDot,
};

/**
 状态栏样式
 
 @constant HTStatusBarStyleInvalid      无效
 @constant HTStatusBarStyleDefault      默认样式：黑色
 @constant HTStatusBarStyleLightContent 白色
 */
typedef NS_ENUM(NSInteger, StatusBarStyle) {
    /// 无效
    HTStatusBarStyleInvalid = 0,
    /// 黑色
    HTStatusBarStyleDefault,
    /// 白色
    HTStatusBarStyleLightContent,
};


@interface HTGlobalEnums : NSObject

@end
