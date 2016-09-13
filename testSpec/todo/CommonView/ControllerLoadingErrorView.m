//
//  ControllerLoadingErrorView.m
//  
//
//  Created by Bai tianyu on 1/21/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "ControllerLoadingErrorView.h"

@interface ControllerLoadingErrorView ()

@property (nonatomic, strong) UILabel *indicationLabel;

@end

@implementation ControllerLoadingErrorView

#pragma mark - Life cycle.

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        [self loadSubViews];
    }
    return self;
}


#pragma mark - Load views.

- (void)loadSubViews {
    _indicationLabel = [[UILabel alloc] init];
    _indicationLabel.text = @"加载失败，点击重试";
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
