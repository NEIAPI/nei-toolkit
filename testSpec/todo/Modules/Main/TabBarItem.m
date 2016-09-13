//
//  TabBarItem.m
//  
//
//  Created by Bai tianyu on 1/18/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "TabBarItem.h"
#import "NSObject+HTSafeObserver.h"

@interface TabBarItem ()

@property (nonatomic, strong) UILabel *titleLabel;
@property (nonatomic, strong) UIImageView *iconImageView;

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *icon;
@property (nonatomic, copy) NSString *selectedIcon;

@end


@implementation TabBarItem

#pragma mark - Life cycle.

- (instancetype)initWithTitle:(NSString *)title icon:(NSString *)icon selectedIcon:(NSString *)selectedIcon {
    if (self = [super initWithFrame:CGRectZero]) {
        _title = title;
        _icon = icon;
        _selectedIcon = selectedIcon;
        
        [self loadSubviews];
        
        [self ht_addObserver:self
                  forKeyPath:@"selected"
                     options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld
                     context:nil];
    }
    return self;
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [self initWithTitle:nil icon:nil selectedIcon:nil]) {
        
    }
    return self;
}


#pragma mark - Load views.

- (void)loadSubviews {
    _titleLabel = [UILabel new];
    _titleLabel.text = _title;
    _titleLabel.textAlignment = NSTextAlignmentCenter;
    _titleLabel.font = [UIFont systemFontOfSize:12];
    [self addSubview:_titleLabel];
    
    _iconImageView = [UIImageView new];
    _iconImageView.image = [UIImage imageNamed:_icon];
    [self addSubview:_iconImageView];
    
    [self selectedChanged];
}


#pragma mark - Layout.

- (void)layoutSubviews {
    [super layoutSubviews];
    
    _titleLabel.frame = CGRectMake(0, CGRectGetHeight(self.frame) - 5 - 12, CGRectGetWidth(self.frame), 12);

    CGFloat iconImageWidth = _iconImageView.image.size.width;
    CGFloat iconImageHeight = _iconImageView.image.size.height;
    _iconImageView.frame = CGRectMake((CGRectGetWidth(self.frame) - iconImageWidth)/2,
                                      4.5,
                                      iconImageWidth,
                                      iconImageHeight);
}


#pragma mark - KVO.

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
    if ([keyPath isEqualToString:@"selected"]) {
        [self selectedChanged];
    }
}

- (void)selectedChanged {
    if ([self isSelected]) {
        _titleLabel.textColor = [UIColor redColor];
        _iconImageView.image = [UIImage imageNamed:_selectedIcon];
    } else {
        _titleLabel.textColor = [UIColor blackColor];
        _iconImageView.image = [UIImage imageNamed:_icon];
    }
}


@end
