//
//  LoginView.h
//  Login
//
//  Created by liuchang on 16/4/11.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import <UIKit/UIKit.h>

/**
 *  登录窗口，提供用户名和密码的输入窗口，以及自动补全功能
 */

@protocol LoginViewDelegate;

NS_ASSUME_NONNULL_BEGIN
@interface LoginView : UIView
@property (nonatomic, readonly, strong) UITextField *usernameTextField;
@property (nonatomic, readonly, strong) UITextField *passwordTextField;
@property (nonatomic, readonly, strong) UIButton    *loginButton;
@property (nonatomic, readonly, strong) UIButton    *forgetPasswordButton;
@property (nonatomic, readonly, strong) UIButton    *signUpButton;
@property (nonatomic, weak) id<LoginViewDelegate> delegate;

- (instancetype)initWithFrame:(CGRect)frame
         parentViewController:(__kindof UIViewController *)parentViewController
                  suffixArray:(NSArray<NSString *> * _Nullable)suffixArray;

/**
 *  隐藏自动补全列表
 */
- (void)hideList;
@end

@protocol LoginViewDelegate <NSObject>
@required
/**
 *  「登录」按钮回调
 *
 *  @param username username
 *  @param password password
 */
- (void)LoginViewLoginButtonPressedWithUsername:(NSString *)username password:(NSString *)password;

@optional
/**
 *  输入的用户名是否合法。当返回 NO 时，自动补全列表会隐藏。
 *
 *  @param username 用户在 username 框中的输入
 *
 *  @return 用户名是否合法
 */
- (BOOL)LoginViewIsUsernameValiad:(NSString *)username;

/**
 *  登录按钮是否可以点击。可以根据「用户名是否合法」、「密码是否达到特定长度」等条件来指定登录按钮是否可以点击。
 *
 *  @param username username
 *  @param password password
 *
 *  @return 登录按钮是否可以点击
 */
- (BOOL)LoginViewIsLoginButtonEnabledWithUsername:(NSString *)username password:(NSString *)password;

/**
 *  「忘记密码？」按钮回调
 */
- (void)LoginViewForgetPasswordButtonPressed;

/**
 *  「注册」按钮回调
 */
- (void)LoginViewSignUpButtonPressed;

/**
 *  用户名输入框内容变化回调
 *
 *  @param loginView         loginView
 *  @param usernameTextField usernameTextField
 */
- (void)LoginView:(LoginView *)loginView usernameChanged:(UITextField *)usernameTextField;

/**
 *  密码输入框变化回调
 *
 *  @param loginView         loginView
 *  @param passwordTextField passwordTextField
 */
- (void)LoginView:(LoginView *)loginView passwordChanged:(UITextField *)passwordTextField;
@end
NS_ASSUME_NONNULL_END
