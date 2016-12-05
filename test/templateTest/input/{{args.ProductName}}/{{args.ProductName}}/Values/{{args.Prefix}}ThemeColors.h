//
//  {{args.Prefix}}ThemeColors.h
//  {{args.ProductName}}
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface {{args.Prefix}}ThemeColors : NSObject

/* ********************* 主题背景色(通常由视觉统一规范规定)相关, 可根据所需自由添加 *************************/

/// 主题色，每个 App 都会有主题色(当然有些可换肤)
+ (UIColor *)themeColor;

/// 1 像素线的颜色
+ (UIColor *)themeLineColor;

/// 按钮的背景色
+ (UIColor *)themeButtonColor;

/// 按钮高亮时的背景色
+ (UIColor *)themeHighlightButtonColor;


/* *********************************** 导航栏颜色相关，可根据所需自由添加 ********************************/

/// 导航栏背景色
+ (UIColor *)naviBackgroundColor;

/// 导航栏字体颜色
+ (UIColor *)naviForegroundColor;


/* ********************* 主题字体颜色(通常由视觉统一规范规定)相关，可根据所需自由添加 ************************/

/// 默认字体颜色
+ (UIColor *)defaultTextColor;


@end
