//
//  HTThemeSizes.m
//  JustATest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "HTThemeSizes.h"

@implementation HTThemeSizes

/* ********************* 系统默认的一些配置，常用于计算布局使用。可根据所需自由添加 ***************************/

+ (CGFloat)screenHeight {
    return [UIScreen mainScreen].bounds.size.height;
}

+ (CGFloat)screenWidth {
    return [UIScreen mainScreen].bounds.size.width;
}

+ (CGSize)screenSize {
    return [UIScreen mainScreen].bounds.size;
}

+ (CGFloat)navigationHeight {
    return 64;
}

+ (CGFloat)tabHeight {
    return 49;
}


/* ********************* 主题字体大小(通常由视觉统一规范规定)相关, 可根据所需自由添加 *************************/

/// 视觉统一规范中，默认的字体样式
+ (UIFont *)themeFont {
    return [UIFont systemFontOfSize:14];
}


/* *********************************** 导航栏字体，可根据所需自由添加 ************************************/

+ (UIFont *)naviTitleFont {
    return [UIFont systemFontOfSize:14];
}


/* ************************ 全局性的边距、高度、宽度等配置，可根据所需自由添加 ******************************/

+ (CGFloat)leftMargin {
    return 12;
}

+ (CGFloat)rightMargin {
    return 12;
}

+ (NSInteger)initialPageNumber {
    return 1;
}

+ (NSInteger)loadmorePageSize {
    return 10;
}

+ (CGFloat)lineWidth {
    return 1.0 / [UIScreen mainScreen].scale;
}

@end
