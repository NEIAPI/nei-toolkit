//
//  ControllerLoadingView.m
//  
//
//  Created by Bai tianyu on 1/21/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "ControllerLoadingView.h"

@interface ControllerLoadingView ()

@property (nonatomic, strong) UILabel *indicationLabel;

@end

@implementation ControllerLoadingView

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
    _indicationLabel.text = @"正在加载";
    _indicationLabel.font = [UIFont systemFontOfSize:13];
    [_indicationLabel sizeToFit];
    _indicationLabel.textColor = [UIColor blackColor];
    _indicationLabel.textAlignment = NSTextAlignmentCenter;
    [self addSubview:_indicationLabel];
}


#pragma mark - Layout.

- (void)layoutSubviews {
    [super layoutSubviews];
    _indicationLabel.center = self.center;
}


@end
