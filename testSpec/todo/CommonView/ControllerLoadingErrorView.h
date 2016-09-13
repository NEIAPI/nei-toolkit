//
//  ControllerLoadingErrorView.h
//  
//
//  Created by Bai tianyu on 1/21/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ControllerLoadingErrorState) {
    ControllerLoadingErrorStateNetworkError,
    ControllerLoadingErrorStateLoginError
};


@protocol ControllerLoadingErrorDelegate <NSObject>

- (void)controllerLoadingReload;

@end


@interface ControllerLoadingErrorView : UIView

@property (nonatomic, assign) ControllerLoadingErrorState state;
@property (nonatomic, weak) id<ControllerLoadingErrorDelegate> delegate;

@end
