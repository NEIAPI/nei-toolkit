//
//  UITableViewCell+Line.h
//  
//
//  Created by Bai tianyu on 1/25/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface UITableViewCell (Line)

- (void)_addBottomLineWithLeftOffset:(CGFloat)leftOffset rightOffset:(CGFloat)rightOffset;

- (void)_addTopLineWithLeftOffset:(CGFloat)leftOffset rightOffset:(CGFloat)rightOffset;

- (void)_removeTopLine;

- (void)_removeBottomLine;

@end
