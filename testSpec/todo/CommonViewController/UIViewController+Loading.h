//
//  UIViewController+Loading.h
//  
//
//  Created by Bai tianyu on 1/21/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ControllerLoadingErrorView.h"

typedef void (^RetryLoadingBlock)();

@interface UIViewController (Loading)<ControllerLoadingErrorDelegate>

// Loading.
- (void)_showLoading;
- (void)_hideLoading;

// Loading empty.
- (void)_showLoadingEmpty;
- (void)_hideLoadingEmpty;

// Loading error.
- (void)_showLoadingErrorWithLoadingViewState:(ControllerLoadingErrorState)state retryBlock:(RetryLoadingBlock)block;


@end
