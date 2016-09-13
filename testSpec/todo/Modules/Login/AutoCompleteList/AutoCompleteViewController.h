//
//  AutoCompleteViewController.h
//  Login
//
//  Created by liuchang on 16/4/25.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

/**
 *  提供了自动补全的 view
 */

@protocol AutoCompleteDelegate;

NS_ASSUME_NONNULL_BEGIN
@interface AutoCompleteViewController : UIViewController
@property (nonatomic, readonly) NSArray<NSString *> *suffixesArray;
@property (nonatomic, weak) id<AutoCompleteDelegate> delegate;

- (instancetype)initWithFrame:(CGRect)frame
         parentViewController:(__kindof UIViewController *)parentViewController
                SuffixesArray:(NSArray<NSString *> *)suffixesArray
                     delegate:(id<AutoCompleteDelegate>)delegate;
- (void)updateSuggest:(NSString *)content;
@end


@protocol AutoCompleteDelegate <NSObject>
- (void)AutoCompleteViewController:(AutoCompleteViewController *)completeViewController didSelect:(NSString *)suggest;
@end
NS_ASSUME_NONNULL_END