//
//  UIViewController+HTCustomNavigationBar.m
//  JustATest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "UIViewController+HTCustomNavigationBar.h"

@implementation UIViewController (HTCustomNavigationBar)

- (void)Pt_applyDefaultNavigationBarStyle {
    // 设置状态栏样式
    self.statusBarStyle = HTStatusBarStyleLightContent;
    // 设置导航栏背景色
    [self.navigationController.navigationBar setBarTintColor:[HTThemeColors naviBackgroundColor]];
    // 设置导航栏是否需要混色
    self.navigationController.navigationBar.translucent = NO;
    
    // 设置导航栏字体颜色、字体样式
    [self.navigationController.navigationBar setTitleTextAttributes:[NSDictionary dictionaryWithObjectsAndKeys:[HTThemeColors naviForegroundColor], NSForegroundColorAttributeName, [HTThemeSizes naviTitleFont], NSFontAttributeName, nil]];
}

- (void)Pt_applyTransparentNavigationBarWhiteStatus {
    
}

- (void)Pt_applyTransparentNavigationBarDarkStatus {
    
}

- (void)Pt_addNavigationLeftBackItem {
    
}

- (UIButton *)Pt_addNavigationLeftItem {
    
}

- (UIButton *)Pt_addNavigationRightItem {
    
}

@end
