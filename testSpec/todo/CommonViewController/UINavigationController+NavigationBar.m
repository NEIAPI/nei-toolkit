//
//  UINavigationController+NavigationBar.m
//  
//
//  Created by Bai tianyu on 1/25/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "UINavigationController+NavigationBar.h"
#import "UINavigationBar+HT.h"

@implementation UINavigationController (NavigationBar)

- (void)_applyDefaultNavigationBarStyle {
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleDefault];
    [self.navigationController.navigationBar ht_setBackgroundColor:[UIColor whiteColor]];
    [self.navigationController.navigationBar setTitleTextAttributes:
     [NSDictionary dictionaryWithObjectsAndKeys:[UIColor whiteColor], NSForegroundColorAttributeName,
                                                [UIFont systemFontOfSize:13], NSFontAttributeName,
                                                nil]];
}

@end
