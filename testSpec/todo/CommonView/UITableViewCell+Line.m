//
//  UITableViewCell+Line.m
//  
//
//  Created by Bai tianyu on 1/25/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <objc/runtime.h>
#import "UITableViewCell+Line.h"
#import "UIView+Line.h"
#import "Masonry.h"

static const char *kTopLineKey;
static const char *kBottomLineKey;

@implementation UITableViewCell (Line)

#pragma mark - Public methods.

- (void)_addBottomLineWithLeftOffset:(CGFloat)leftOffset rightOffset:(CGFloat)rightOffset {
    UIView *line = [self _getCellLineByKey:&kBottomLineKey];
    [line removeFromSuperview];
    [self.contentView addSubview:line];
    
    [line mas_makeConstraints:^(MASConstraintMaker *make) {
        make.bottom.equalTo(self.contentView);
        make.left.equalTo(self.contentView).with.offset(leftOffset);
        make.right.equalTo(self.contentView).with.offset(-rightOffset);
        make.height.equalTo(@(SINGLE_LINE_WIDTH));
    }];
}

- (void)_addTopLineWithLeftOffset:(CGFloat)leftOffset rightOffset:(CGFloat)rightOffset {
    UIView *line = [self _getCellLineByKey:&kTopLineKey];
    [line removeFromSuperview];
    [self.contentView addSubview:line];
    
    [line mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.equalTo(self.contentView);
        make.left.equalTo(self.contentView).with.offset(leftOffset);
        make.right.equalTo(self.contentView).with.offset(-rightOffset);
        make.height.equalTo(@(SINGLE_LINE_WIDTH));
    }];
}

- (void)_removeTopLine {
    UIView *line = [self _getCellLineByKey:&kTopLineKey];
    [line removeFromSuperview];
}

- (void)_removeBottomLine {
    UIView *line = [self _getCellLineByKey:&kBottomLineKey];
    [line removeFromSuperview];
}


#pragma mark - Private methods.

- (UIView *)_getCellLineByKey:(void *)key {
    UIView *line = objc_getAssociatedObject(self, key);
    if (!line) {
        line = [UIView _line];
        objc_setAssociatedObject(self, key, line, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    return line;
}


@end
