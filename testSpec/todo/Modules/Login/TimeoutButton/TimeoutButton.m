//
//  TimeoutButton.m
//  Login
//
//  Created by liuchang on 16/5/9.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import "TimeoutButton.h"


@interface TimeoutButton ()
@property (nonatomic, assign) NSTimeInterval        timeInterval;
@property (nonatomic, assign) NSTimeInterval        timeout;
@property (nonatomic, assign) NSTimeInterval        timePassed;

@property (nonatomic, strong) dispatch_source_t     intervalTimer;
@property (nonatomic, assign) unsigned long long    flag;           // 防止 after block 中调用上一次的 block 而做的随机值
@end

@implementation TimeoutButton
#pragma mark - Init Method
+ (instancetype)buttonWithType:(UIButtonType)buttonType {
    return [self buttonWithType:buttonType timeInterval:1 timeout:60 delegate:nil];
}
+ (instancetype)buttonWithType:(UIButtonType)buttonType delegate:(nullable id<TimeoutButtonDelegate>)delegate {
    return [self buttonWithType:buttonType timeInterval:1 timeout:60 delegate:delegate];
}
+ (instancetype)buttonWithType:(UIButtonType)buttonType
                  timeInterval:(NSTimeInterval)timeInterval
                       timeout:(NSTimeInterval)timeout
                      delegate:(id<TimeoutButtonDelegate>)delegate {
    TimeoutButton *button = ({
        TimeoutButton *button = [super buttonWithType:buttonType];
        button.timeInterval     = timeInterval;
        button.timeout          = timeout;
        button.delegate         = delegate;
        button.timePassed       = 0;
        [button addTarget:button action:@selector(selfPressed:) forControlEvents:UIControlEventTouchUpInside];
        [button createAndSusbendTimer];
        button;
    });
    
    return button;
}

/**
 *  创建 timer
 */
- (void)createAndSusbendTimer {
    if (self.intervalTimer != nil) {
        return;
    }
    __weak typeof(self) weakSelf = self;
    _intervalTimer = ({
        dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_main_queue());
        dispatch_source_set_timer(timer, DISPATCH_TIME_NOW, self.timeInterval * NSEC_PER_SEC, 0 * NSEC_PER_SEC);
        dispatch_source_set_event_handler(timer, ^{
            weakSelf.timePassed += weakSelf.timeInterval;
            if ([weakSelf.delegate respondsToSelector:@selector(TimeoutButtonClick:passedTime:remainingTime:)]) {
                if (weakSelf.autoRefreshTextByTimeRemaining) {
                    NSString *text = [NSString stringWithFormat:@"%ld", (long)weakSelf.timeRemaining];
                    [weakSelf setTitle:text forState:UIControlStateDisabled];
                }

                if (weakSelf.timePassed > 0 && weakSelf.timePassed <= weakSelf.timeout) {
                    [weakSelf.delegate TimeoutButtonClick:weakSelf passedTime:weakSelf.timePassed remainingTime:weakSelf.timeRemaining];
                }
            }
        });
        timer;
    });
}

#pragma mark - Life Cycle
- (void)dealloc {
    if (_intervalTimer != nil) {
        dispatch_source_cancel(_intervalTimer);
        
        if (self.enabled) {
            dispatch_resume(_intervalTimer);
            _intervalTimer = NULL;
        }
    }
}

#pragma mark - Actions
- (void)selfPressed:(UIButton *)button {
    self.enabled = NO;

    dispatch_source_set_timer(self.intervalTimer, DISPATCH_TIME_NOW, self.timeInterval * NSEC_PER_SEC, 0 * NSEC_PER_SEC);
    dispatch_resume(self.intervalTimer);
    
    self.flag = ({
        u_int32_t ri1 = arc4random();
        u_int32_t ri2 = arc4random();
        unsigned long long rl = ri1;
        rl <<= sizeof(u_int32_t) * 8;
        rl |= ri2;
        
        rl;
    });
    NSUInteger flag = self.flag;
    
    // 如果点击按钮 -> 调用 reset -> 再次点击按钮，则第一次的 after block 会在第二次点击后被调用，这里做了一个校验：
    // 每次被点击时，随机生成一个 ull 类型的整数，利用 block 会复制原生类型的特点，在 after block 中判断一次。
    // 即可避免该问题
    
    __weak typeof(self) weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(self.timeout * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        if (flag != weakSelf.flag ) {
            return ;
        }
        if (!weakSelf.enabled &&
            [weakSelf.delegate respondsToSelector:@selector(TimeoutButtonTimeout:)]) {
            [weakSelf.delegate TimeoutButtonTimeout:weakSelf];
        }
        [weakSelf reset];
    });
}

#pragma mark - Public Methods
/**
 *  暂停
 */
- (void)pause {
    
}

/**
 *  继续
 */
- (void)countinue {
    
}

/**
 *  恢复到未被点击状态
 */
- (void)reset {
    // 处于计时状态时才进行处理
    if (!self.enabled) {
        self.enabled = YES;
        self.timePassed = 0;
        dispatch_suspend(self.intervalTimer);
    }
}
#pragma mark - Delegate，DataSource, Callback Method
#pragma mark - Getter And Setter
- (NSTimeInterval)timeRemaining {
    return self.timeout - self.timePassed;
}

@end
