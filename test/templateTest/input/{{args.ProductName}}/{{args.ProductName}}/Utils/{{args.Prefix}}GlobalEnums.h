//
//  {{args.Prefix}}GlobalEnums.h
//  {{args.ProductName}}
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 红点的类型，用于未读消息这类场景。
 
 @constant {{args.Prefix}}BadgeTypeText 带有文字的圆点

 @constant {{args.Prefix}}BadgeTypeDot 不含有文字的圆点
 */
typedef NS_ENUM(NSUInteger, {{args.Prefix}}BadgeType) {
    /// 带有文字的圆点
    {{args.Prefix}}BadgeTypeText,
    /// 不含有文字的圆点
    {{args.Prefix}}BadgeTypeDot,
};

/**
 状态栏样式
 
 @constant {{args.Prefix}}StatusBarStyleInvalid      无效
 @constant {{args.Prefix}}StatusBarStyleDefault      默认样式：黑色
 @constant {{args.Prefix}}StatusBarStyleLightContent 白色
 */
typedef NS_ENUM(NSInteger, StatusBarStyle) {
    /// 无效
    {{args.Prefix}}StatusBarStyleInvalid = 0,
    /// 黑色
    {{args.Prefix}}StatusBarStyleDefault,
    /// 白色
    {{args.Prefix}}StatusBarStyleLightContent,
};


@interface {{args.Prefix}}GlobalEnums : NSObject

@end
