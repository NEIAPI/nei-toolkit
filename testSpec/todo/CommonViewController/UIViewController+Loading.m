//
//  UIViewController+Loading.m
//  
//
//  Created by Bai tianyu on 1/21/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <objc/runtime.h>
#import "UIViewController+Loading.h"
#import "ControllerLoadingView.h"
#import "ControllerLoadingEmptyView.h"
#import "Masonry.h"

static const char *kLoadingKey;
static const char *kLoadingEmptyKey;
static const char *kLoadingErrorKey;
static const char *kRetryBlockKey;

@implementation UIViewController (Loading)

#pragma mark - Loading

- (void)_showLoading {
    ControllerLoadingView *loadingView = [self _getLoadingView];
    if (!loadingView.superview) {
        [self.view addSubview:loadingView];
    }
    [self.view bringSubviewToFront:loadingView];
}

- (void)_hideLoading {
    ControllerLoadingView *loadingView = [self _getLoadingView];
    if (loadingView.superview) {
        [loadingView removeFromSuperview];
    }
}

- (ControllerLoadingView *)_getLoadingView {
    ControllerLoadingView *loadingView = objc_getAssociatedObject(self, &kLoadingKey);
    if (!loadingView) {
        loadingView = [[ControllerLoadingView alloc] init];
        [self.view addSubview:loadingView];
        objc_setAssociatedObject(self, &kLoadingKey, loadingView, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    
    [loadingView mas_remakeConstraints:^(MASConstraintMaker *make) {
        make.size.equalTo(self.view);
        make.center.equalTo(self.view);
    }];
    
    return loadingView;
}


#pragma mark - Loading empty.

- (void)_showLoadingEmpty {
    ControllerLoadingEmptyView *loadingEmptyView = [self _getLoadingEmptyView];
    if (!loadingEmptyView.superview) {
        [self.view addSubview:loadingEmptyView];
    }
    [self.view bringSubviewToFront:loadingEmptyView];
}

- (void)_hideLoadingEmpty {
    ControllerLoadingEmptyView *loadingEmptyView = [self _getLoadingEmptyView];
    if (loadingEmptyView.superview) {
        [loadingEmptyView removeFromSuperview];
    }
}

- (ControllerLoadingEmptyView *)_getLoadingEmptyView {
    ControllerLoadingEmptyView *loadingEmptyView = objc_getAssociatedObject(self, &kLoadingEmptyKey);
    if (!loadingEmptyView) {
        loadingEmptyView = [[ControllerLoadingEmptyView alloc] init];
        [self.view addSubview:loadingEmptyView];
        objc_setAssociatedObject(self, &kLoadingEmptyKey, loadingEmptyView, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    
    [loadingEmptyView mas_remakeConstraints:^(MASConstraintMaker *make) {
        make.size.equalTo(self.view);
        make.center.equalTo(self.view);
    }];
    
    return loadingEmptyView;
}


#pragma mark - Loading error.

- (void)_showLoadingErrorWithLoadingViewState:(ControllerLoadingErrorState)state retryBlock:(RetryLoadingBlock)block {
    [self _hideLoading];
    ControllerLoadingErrorView *loadingErrorView = [self _getLoadingErrorView];
    if (!loadingErrorView.superview) {
        [self.view addSubview:loadingErrorView];
    }
    [self.view bringSubviewToFront:loadingErrorView];
    
    loadingErrorView.state = state;
    objc_setAssociatedObject(self, &kRetryBlockKey, block, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)_hideLoadingError {
    ControllerLoadingErrorView *loadingErrorView = [self _getLoadingErrorView];
    if (loadingErrorView.superview) {
        [loadingErrorView removeFromSuperview];
    }
}

- (ControllerLoadingErrorView *)_getLoadingErrorView {
    ControllerLoadingErrorView *loadingErrorView = objc_getAssociatedObject(self, &kLoadingErrorKey);
    if (!loadingErrorView) {
        loadingErrorView = [[ControllerLoadingErrorView alloc] init];
        [self.view addSubview:loadingErrorView];
        objc_setAssociatedObject(self, &kLoadingErrorKey, loadingErrorView, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    
    [loadingErrorView mas_remakeConstraints:^(MASConstraintMaker *make) {
        make.size.equalTo(self.view);
        make.center.equalTo(self.view);
    }];
    
    return loadingErrorView;
}


#pragma mark - ControllerLoadingErrorDelegate

- (void)controllerLoadingReload {
    [self _showLoading];
    [self _hideLoadingError];
    RetryLoadingBlock retryBlock = objc_getAssociatedObject(self, &kRetryBlockKey);
    retryBlock();
}

@end
