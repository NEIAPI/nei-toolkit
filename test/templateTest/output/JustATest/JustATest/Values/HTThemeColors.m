//
//  HTThemeColors.m
//  JustATest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "HTThemeColors.h"
#import "ColorUtils.h"

@implementation HTThemeColors

/* ********************* 主题背景色(通常由视觉统一规范规定)相关 *************************/

+ (UIColor *)themeLineColor {
    return [UIColor lightGrayColor];
}

+ (UIColor *)themeColor {
    return [UIColor colorWithRGBValue:0x32A2EC];
}

+ (UIColor *)themeButtonColor {
    return [UIColor blueColor];
}

+ (UIColor *)themeHighlightButtonColor {
    return [UIColor yellowColor];
}


/* *********************************** 导航栏相关 ***********************************/

+ (UIColor *)naviBackgroundColor {
    return [self themeColor];
}

+ (UIColor *)naviForegroundColor {
    return [UIColor blackColor];
}


/* ********************* 主题字体颜色(通常由视觉统一规范规定)相关 *************************/

+ (UIColor *)defaultTextColor {
    return [UIColor blackColor];
}

@end
