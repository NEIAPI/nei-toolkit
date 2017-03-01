//
//  UIViewController+CustomNavigationBar.m
//  JustTest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "UIViewController+CustomNavigationBar.h"

@implementation UIViewController (CustomNavigationBar)

- (void)_applyDefaultNavigationBarStyle {
    // 设置状态栏样式
    self.statusBarStyle = StatusBarStyleLightContent;
    // 设置导航栏背景色
    [self.navigationController.navigationBar setBarTintColor:[ThemeColors naviBackgroundColor]];
    // 设置导航栏是否需要混色
    self.navigationController.navigationBar.translucent = NO;
    
    // 设置导航栏字体颜色、字体样式
    [self.navigationController.navigationBar setTitleTextAttributes:[NSDictionary dictionaryWithObjectsAndKeys:[ThemeColors naviForegroundColor], NSForegroundColorAttributeName, [ThemeSizes naviTitleFont], NSFontAttributeName, nil]];
}

- (void)_applyTransparentNavigationBarWhiteStatus {
    
}

- (void)_applyTransparentNavigationBarDarkStatus {
    
}

- (void)_addNavigationLeftBackItem {
    
}

- (UIButton *)_addNavigationLeftItem {
    
}

- (UIButton *)_addNavigationRightItem {
    
}

@end
