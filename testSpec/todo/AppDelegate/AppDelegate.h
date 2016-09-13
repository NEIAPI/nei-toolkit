//
//  AppDelegate.h
//  
//
//  Created by Bai tianyu on 1/14/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

#define APPDELEGATE() ((AppDelegate *)[[UIApplication sharedApplication] delegate])

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

@end

