//
//  UIViewController+{{args.Prefix}}CustomNavigationBar.m
//  {{args.ProductName}}
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "UIViewController+{{args.Prefix}}CustomNavigationBar.h"

@implementation UIViewController ({{args.Prefix}}CustomNavigationBar)

- (void){{args.CategoryPrefix}}_applyDefaultNavigationBarStyle {
    // 设置状态栏样式
    self.statusBarStyle = {{args.Prefix}}StatusBarStyleLightContent;
    // 设置导航栏背景色
    [self.navigationController.navigationBar setBarTintColor:[{{args.Prefix}}ThemeColors naviBackgroundColor]];
    // 设置导航栏是否需要混色
    self.navigationController.navigationBar.translucent = NO;
    
    // 设置导航栏字体颜色、字体样式
    [self.navigationController.navigationBar setTitleTextAttributes:[NSDictionary dictionaryWithObjectsAndKeys:[{{args.Prefix}}ThemeColors naviForegroundColor], NSForegroundColorAttributeName, [{{args.Prefix}}ThemeSizes naviTitleFont], NSFontAttributeName, nil]];
}

- (void){{args.CategoryPrefix}}_applyTransparentNavigationBarWhiteStatus {
    
}

- (void){{args.CategoryPrefix}}_applyTransparentNavigationBarDarkStatus {
    
}

- (void){{args.CategoryPrefix}}_addNavigationLeftBackItem {
    
}

- (UIButton *){{args.CategoryPrefix}}_addNavigationLeftItem {
    
}

- (UIButton *){{args.CategoryPrefix}}_addNavigationRightItem {
    
}

@end
