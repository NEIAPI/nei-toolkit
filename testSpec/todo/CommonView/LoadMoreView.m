//
//  LoadMoreView.m
//  
//
//  Created by Bai tianyu on 1/18/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "LoadMoreView.h"

@interface LoadMoreView ()

@end


@implementation LoadMoreView

#pragma mark - Load views.

- (void)loadSubViews {
    // Custom your own RefreshView.
    
}

- (void)layoutSubviews {
    [super layoutSubviews];
    // Layout subviews.
}


#pragma mark - HTRefreshViewDelegate

- (CGFloat)refreshingInset {
    return 0;
}

- (CGFloat)refreshableInset {
    return 0;
}

- (CGFloat)promptingInset {
    return self.hiddenRefresh? 0 : 46;
}

- (void)refreshStateChanged:(HTRefreshState)state {
    switch (state) {
        case HTRefreshStateCanEngageRefresh: {
            
        }
            break;
        case HTRefreshStateDidEngageRefresh:

            break;
        case HTRefreshStateDidDisengageRefresh: {

        }
            break;
        case HTRefreshStateWillEndRefresh: {
            
        }
            break;
        case HTRefreshStateDidEndRefresh: {

        }
            break;
    }
}

- (void)refreshPercentChanged:(CGFloat)percent
                       offset:(CGFloat)offset
                    direction:(HTRefreshDirection)direction {
    if (direction != HTRefreshDirectionBottom || (direction != HTRefreshDirectionRight)) {
        return;
    }
}

@end