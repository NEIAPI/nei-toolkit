//
//  LoginView.m
//  Login
//
//  Created by liuchang on 16/4/11.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import "LoginView.h"
#import "AutoCompleteViewController.h"

@interface LoginView ()<AutoCompleteDelegate>
@property (nonatomic, strong) AutoCompleteViewController *autoCompleteVC;
@end

@implementation LoginView
#pragma mark - Init Method
- (instancetype)initWithFrame:(CGRect)frame
         parentViewController:(__kindof UIViewController *)parentViewController
                  suffixArray:(NSArray<NSString *> *)suffixArray {
    self = [super initWithFrame:frame];
    if (self != nil) {
        _usernameTextField = ({
            UITextField *textField = [self createTextFieldWithPlaceHolder:@"邮箱/用户名"];
            textField.frame = (CGRect){0, 0, self.frame.size.width, 50};
            [self addSubview:textField];
            textField.keyboardType = UIKeyboardTypeEmailAddress;
            textField.autocapitalizationType = UITextAutocapitalizationTypeNone;
            [textField addTarget:self action:@selector(usernameChanged:) forControlEvents:UIControlEventEditingChanged];
            textField;
        });
        
        _passwordTextField  = ({
            UITextField *textField = [self createTextFieldWithPlaceHolder:@"密码"];
            textField.frame = (CGRect){0, 50, self.frame.size.width, 50};
            [self addSubview:textField];
            textField.secureTextEntry = YES;
            textField.returnKeyType = UIReturnKeyDone;
            [textField addTarget:self action:@selector(passwordChanged:) forControlEvents:UIControlEventEditingChanged];
            textField;
        });
        
        _loginButton = ({
            UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
            [button setTitle:@"登录" forState:UIControlStateNormal];
            button.frame = (CGRect){0, 100, self.frame.size.width, 50};
            [self addSubview:button];
            [button addTarget:self action:@selector(loginButtonPressed:) forControlEvents:UIControlEventTouchUpInside];
            button.enabled = NO;
            button;
        });
        
        _forgetPasswordButton = ({
            UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
            [button setTitle:@"忘记密码？" forState:UIControlStateNormal];
            button.frame = (CGRect){0, 150, 100, 20};
            [self addSubview:button];
            [button addTarget:self action:@selector(forgetPasswordButtonPressed:) forControlEvents:UIControlEventTouchUpInside];
            button;
        });
        
        _signUpButton = ({
            UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
            [button setTitle:@"注册" forState:UIControlStateNormal];
            button.frame = (CGRect){self.frame.size.width - 100, 150, 100, 20};
            [self addSubview:button];
            [button addTarget:self action:@selector(signUpButtonPressed:) forControlEvents:UIControlEventTouchUpInside];
            button;
        });
        
        if (suffixArray == nil) {
            suffixArray = @[@"163.com",
                            @"126.com",
                            @"yeah.net",
                            @"vip.163.com",
                            @"vip.126.com",
                            @"188.com",
                            @"vip.188.com",
                            @"qq.com",
                            @"gmail.com",
                            @"sina.com",];
        }
        _autoCompleteVC = [[AutoCompleteViewController alloc] initWithFrame:(CGRect){0, _usernameTextField.frame.size.height, _usernameTextField.frame.size.width, 240}
                                                         parentViewController:parentViewController
                                                                SuffixesArray:suffixArray
                                                                     delegate:self];
        [self addSubview:_autoCompleteVC.view];
    }
    return self;
}

- (UITextField *)createTextFieldWithPlaceHolder:(NSString *)placeHolder {
    UITextField* textField = [[UITextField alloc] init];
    
    textField.attributedPlaceholder = [[NSAttributedString alloc] initWithString:placeHolder
                                                                      attributes:@{NSForegroundColorAttributeName:[UIColor darkGrayColor]}];
    
    textField.textColor = [UIColor darkGrayColor];
    textField.font = [UIFont systemFontOfSize:15];
    textField.clearButtonMode = UITextFieldViewModeWhileEditing;
    
    return textField;
}

#pragma mark - Public Methods
- (void)hideList {
    _autoCompleteVC.view.hidden = YES;
}

#pragma mark - Actions
- (void)usernameChanged:(UITextField *)textField {
    [self refreshLoginButtonEnabled];
    
    BOOL isUsernameValiad = YES;
    _autoCompleteVC.view.hidden = ({
        if ([_delegate respondsToSelector:@selector(LoginViewIsUsernameValiad:)]) {
            isUsernameValiad = [_delegate LoginViewIsUsernameValiad:_usernameTextField.text];
        }
        !isUsernameValiad;
    });
    
    // 如果用户名不合法，直接返回
    if (!isUsernameValiad) {
        return;
    }
    
    [_autoCompleteVC updateSuggest:textField.text];
    
    if ([_delegate respondsToSelector:@selector(LoginView:usernameChanged:)]) {
        [_delegate LoginView:self usernameChanged:textField];
    }
}

- (void)passwordChanged:(UITextField *)textField {
    [self refreshLoginButtonEnabled];
    
    if ([_delegate respondsToSelector:@selector(LoginView:passwordChanged:)]) {
        [_delegate LoginView:self passwordChanged:textField];
    }
}

- (void)loginButtonPressed:(UIButton *)button {
    if ([_delegate respondsToSelector:@selector(LoginViewLoginButtonPressedWithUsername:password:)]) {
        [_delegate LoginViewLoginButtonPressedWithUsername:_usernameTextField.text password:_passwordTextField.text];
    }
}

- (void)forgetPasswordButtonPressed:(UIButton *)button {
    if ([_delegate respondsToSelector:@selector(LoginViewForgetPasswordButtonPressed)]) {
        [_delegate LoginViewForgetPasswordButtonPressed];
    }
}

- (void)signUpButtonPressed:(UIButton *)button {
    if ([_delegate respondsToSelector:@selector(LoginViewSignUpButtonPressed)]) {
        [_delegate LoginViewSignUpButtonPressed];
    }
}

#pragma mark - Delegate，DataSource, Callback Method
- (void)AutoCompleteViewController:(AutoCompleteViewController *)completeViewController
                           didSelect:(NSString *)suggest {
    _usernameTextField.text = suggest;
    [self refreshLoginButtonEnabled];
}

#pragma mark - Helper Methods
/**
 *  更新登录按钮是否可点击
 */
- (void)refreshLoginButtonEnabled {
    _loginButton.enabled = ({
        BOOL isEnabled;
        if ([_delegate respondsToSelector:@selector(LoginViewIsLoginButtonEnabledWithUsername:password:)]) {
            isEnabled = [_delegate LoginViewIsLoginButtonEnabledWithUsername:_usernameTextField.text password:_passwordTextField.text];
        } else {
            isEnabled = _usernameTextField.text.length > 0 && _passwordTextField.text.length > 0;
        }
        isEnabled;
    });
}
@end
