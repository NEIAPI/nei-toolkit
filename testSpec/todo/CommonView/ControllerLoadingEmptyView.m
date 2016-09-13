//
//  ControllerEmptyView.m
//  
//
//  Created by Bai tianyu on 1/21/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "ControllerLoadingEmptyView.h"

@interface ControllerLoadingEmptyView ()

@property (nonatomic, strong) UILabel *indicationLabel;

@end

@implementation ControllerLoadingEmptyView

#pragma mark - Life cycle.

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        self.backgroundColor = [UIColor whiteColor];
        [self loadSubViews];
    }
    return self;
}


#pragma mark - Load views.

- (void)loadSubViews {
    _indicationLabel = [[UILabel alloc] init];
    _indicationLabel.text = @"暂时没有数据";
    _indicationLabel.textColor = [UIColor blackColor];
    _indicationLabel.font = [UIFont systemFontOfSize:13];
    [_indicationLabel sizeToFit];
    _indicationLabel.textAlignment = NSTextAlignmentCenter;
    [self addSubview:_indicationLabel];
}


#pragma mark - Layout.

- (void)layoutSubviews {
    [super layoutSubviews];
    _indicationLabel.center = self.center;
}

@end
