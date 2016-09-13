//
//  TimeoutButton.h
//  Login
//
//  Created by liuchang on 16/5/9.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN
@class TimeoutButton;

/**
 *  TimeoutButtonDelegate 协议中的方法，都会在主线程中被调用
 */
@protocol TimeoutButtonDelegate <NSObject>
- (void)TimeoutButtonClick:(TimeoutButton *)button
                  passedTime:(NSTimeInterval)timePassed
               remainingTime:(NSTimeInterval)timeRemaining;

- (void)TimeoutButtonTimeout:(TimeoutButton *)button;
@end

@interface TimeoutButton : UIButton
@property (nonatomic, readonly, assign) NSTimeInterval  timeInterval;
@property (nonatomic, readonly, assign) NSTimeInterval  timeout;
@property (nonatomic, readonly, assign) NSTimeInterval  timePassed;
@property (nonatomic, readonly, assign) NSTimeInterval  timeRemaining;
@property (nonatomic, weak) id<TimeoutButtonDelegate> delegate;

@property (nonatomic, assign) BOOL  autoRefreshTextByTimeRemaining;

+ (instancetype)buttonWithType:(UIButtonType)buttonType delegate:(nullable id<TimeoutButtonDelegate>)delegate;
+ (instancetype)buttonWithType:(UIButtonType)buttonType
                  timeInterval:(NSTimeInterval)timeInterval
                       timeout:(NSTimeInterval)timeout
                      delegate:(nullable id<TimeoutButtonDelegate>)delegate;

- (void)reset;
@end
NS_ASSUME_NONNULL_END