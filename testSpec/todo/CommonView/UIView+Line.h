//
//  UIView+Line.h
//  
//
//  Created by Bai tianyu on 1/25/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

#define SINGLE_LINE_WIDTH (1.0/UIScreen.mainScreen.scale)

typedef NS_ENUM(NSInteger, LineLocation) {
    LineLocationTop = 0,
    LineLocationLeft,
    LineLocationRight,
    LineLocationBottom
};


@interface UIView (Line)

+ (instancetype)_line;
+ (instancetype)_lineWithColor:(UIColor *)color;

@end
