//
//  UIViewController+CustomNavigationBar.h
//  JustTest
//
//  Created by Baitianyu on 05/12/2016.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface UIViewController (CustomNavigationBar)

/**
 默认导航栏样式
 
 @note 需要根据视觉要求，自定义本方法实现中的样式定制
 */
- (void)_applyDefaultNavigationBarStyle;

/**
 透明导航栏样式，白色状态栏
 
 @note 需要根据视觉要求，自定义本方法实现中的样式定制
 */
- (void)_applyTransparentNavigationBarWhiteStatus;

/**
 透明导航栏，黑色状态栏
 
 @note 需要根据视觉要求，自定义本方法实现中的样式定制
 */
- (void)_applyTransparentNavigationBarDarkStatus;

/**
 添加左侧返回键
 
 @note 需要根据视觉要求，自定义本方法实现中的样式定制
 */
- (void)_addNavigationLeftBackItem;

/**
 添加导航栏左侧按钮，不为该 button 添加任何点击行为与视觉
 
 @return 添加的 button
 
 @note 需要根据视觉要求，自定义本方法实现中的样式定制
 */
- (UIButton *)_addNavigationLeftItem;

/**
 添加导航栏右侧按钮， 不为该 button 添加任何点击行为与视觉
 
 @return 添加的 button
 
 @note 需要根据视觉要求，自定义本方法实现中的样式定制
 */
- (UIButton *)_addNavigationRightItem;

@end
