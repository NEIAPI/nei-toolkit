//
//  HTThemeSizes.h
//  JustATest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface HTThemeSizes : NSObject

/* ********************* 系统默认的一些配置，常用于计算布局使用。可根据所需自由添加 ***************************/

/// 屏幕高度
+ (CGFloat)screenHeight;

/// 屏幕宽度
+ (CGFloat)screenWidth;

/// 屏幕大小
+ (CGSize)screenSize;

/// 导航栏高度(包含状态栏)
+ (CGFloat)navigationHeight;

/// Tabbar 的高度
+ (CGFloat)tabHeight;


/* ********************* 主题字体大小(通常由视觉统一规范规定)相关, 可根据所需自由添加 *************************/

/// 视觉统一规范中，默认的字体样式
+ (UIFont *)themeFont;


/* *********************************** 导航栏字体，可根据所需自由添加 ************************************/

/// 导航栏字体样式
+ (UIFont *)naviTitleFont;


/* *********************************** 全局性的边距等配置，可根据所需自由添加 ******************************/

/// 视觉统一规范中，一些 icon、label 等视图与父容器的左边距
+ (CGFloat)leftMargin;

/// 视觉统一规范中，一些 icon、label 等视图与父容器的右边距
+ (CGFloat)rightMargin;

/// 用于分页加载逻辑，初始加载的页面编号(服务器有时以 0 开始，有时以 1 开始，开发者需根据服务器需求修改该值)
+ (NSInteger)initialPageNumber;

/// 用于分页加载逻辑，每次加载的 item 数量，可依据需求修改该值
+ (NSInteger)loadmorePageSize;

/// 1 像素线的宽度/高度
+ (CGFloat)lineWidth;

@end
