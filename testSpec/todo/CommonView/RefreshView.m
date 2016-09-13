//
//  RefreshView.m
//  
//
//  Created by Bai tianyu on 1/18/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "RefreshView.h"

@interface RefreshView ()

@end


@implementation RefreshView

#pragma mark - Load views.

// Custom your own RefreshView.
- (void)loadSubViews {

}

- (void)layoutSubviews {
    [super layoutSubviews];
    // Layout the subviews.
}


#pragma mark - HTRefreshViewDelegate

- (CGFloat)refreshingInset {
    return 46;
}

- (CGFloat)refreshableInset {
    return 46;
}

- (void)refreshStateChanged:(HTRefreshState)state {
    switch (state) {
        case HTRefreshStateCanEngageRefresh: {
            // Refresh is permitted.
        }
            break;
        case HTRefreshStateDidEngageRefresh:{
            // Refresh is on going.
        }
            break;
        case HTRefreshStateDidDisengageRefresh: {
            
        }
            break;
        case HTRefreshStateWillEndRefresh: {
            
        }
            break;
        case HTRefreshStateDidEndRefresh: {
            // Refresh is end.
        }
            break;
    }
}

- (void)refreshPercentChanged:(CGFloat)percent
                       offset:(CGFloat)offset
                    direction:(HTRefreshDirection)direction {
    if (direction != HTRefreshDirectionTop || (direction != HTRefreshDirectionLeft)) {
        return;
    }
}

@end
