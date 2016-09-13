//
//  UIView+Line.m
//  
//
//  Created by Bai tianyu on 1/25/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "UIView+Line.h"
#import "UIImage+ImageWithColor.h"

@implementation UIView (Line)

+ (instancetype)_line {
    UIView *line = [[UIView alloc] init];
    line.frame = CGRectMake(0, 0, SINGLE_LINE_WIDTH, SINGLE_LINE_WIDTH);
    line.backgroundColor = [UIColor grayColor];
    return line;
}

+ (instancetype)_lineWithColor:(UIColor *)color {
    UIView *line = [self _line];
    line.backgroundColor = color;
    return line;
}

@end
