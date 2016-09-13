//
//  AutoCompleteViewController.m
//  Login
//
//  Created by liuchang on 16/4/25.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import "AutoCompleteViewController.h"
#import "NSArray+Collection.h"

@interface AutoCompleteViewController ()<UITableViewDelegate, UITableViewDataSource>
@property (nonatomic, strong) UITableView *suggestTableView;        // 补全列表
@property (nonatomic, strong) NSArray<NSString *> *suggestArray;    // 补全列表内容
@end

@implementation AutoCompleteViewController
#pragma mark - Init Method
- (instancetype)initWithFrame:(CGRect)frame
         parentViewController:(__kindof UIViewController *)parentViewController
                SuffixesArray:(NSArray<NSString *> *)suffixesArray
                     delegate:(id<AutoCompleteDelegate>)delegate {
    self = [super init];
    if (self != nil) {
        self.view.frame = frame;
        self.view.hidden = YES;
        
        [parentViewController addChildViewController:self];
        [self didMoveToParentViewController:parentViewController];
        
        _suffixesArray = [suffixesArray copy];
        self.delegate = delegate;
        _suggestArray = [NSArray array];
        
        _suggestTableView = ({
            UITableView *tableView = [[UITableView alloc] initWithFrame:self.view.bounds];
            [self.view addSubview:tableView];
            tableView.delegate = self;
            tableView.dataSource = self;
            tableView.rowHeight = 50;
            tableView;
        });
    }
    return self;
}

#pragma mark - Life Cycle
- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}
#pragma mark - Public Methods
- (void)updateSuggest:(NSString *)content {
    if (content.length == 0) {
        self.view.hidden = YES;
        return;
    }
    
    NSArray<NSString *> *email = [content componentsSeparatedByString:@"@"];
    self.view.hidden = (email.count > 2) ? YES : NO;
    if (email.count > 2) {
        return;
    }
    
    NSString *prefix = email[0];
    NSString *suffix = ({
        NSString *suffix = @"";
        if (email.count > 1) {
            suffix = email[1];
        }
        suffix;
    });
    
    // prefix: zhangsan
    // suffix: 163.com or ""
    _suggestArray = [self suggestEmailArrayByEmailPrefix:prefix suffix:suffix];
    if (_suggestArray.count == 0) {
        self.view.hidden = YES;
    }
    if (_suggestArray.count == 1 && [_suggestArray.firstObject isEqualToString:content]) {
        self.view.hidden = YES;
    }
    [_suggestTableView reloadData];
}
#pragma mark - Private Methods
#pragma mark - Delegate，DataSource, Callback Method
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return _suggestArray.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    NSString *identifierString = @"autoCompleteCell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:identifierString];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:identifierString];
    }
    cell.textLabel.text = _suggestArray[indexPath.row];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    self.view.hidden = YES;
    if ([_delegate respondsToSelector:@selector(AutoCompleteViewController:didSelect:)]) {
        [_delegate AutoCompleteViewController:self didSelect:[tableView cellForRowAtIndexPath:indexPath].textLabel.text];
    }
}
#pragma mark - Helper Method
/**
 *  根据邮箱前缀和邮箱后缀，返回补全的 email 数组。例如，emailPrefix = zhangsan，emailSuffix = @1，则返回@[@"zhangsan@163.com", @"zhangsan@126.com" ...] 等邮箱开头是 1 的条目。
 *
 *  @param emailPrefix 邮箱前缀
 *  @param emailSuffix 邮箱后缀
 *
 *  @return 自动补全的邮箱条目
 */
- (NSArray<NSString *> *)suggestEmailArrayByEmailPrefix:(NSString *)emailPrefix suffix:(NSString *)emailSuffix {
    return [[_suffixesArray _filterWithBlock:^BOOL(NSString * _Nonnull obj, NSUInteger index) {
        if ([emailSuffix isEqualToString:@""]) {
            return YES;
        }
        return [obj hasPrefix:emailSuffix];
    }] _mapWithBlock:^id _Nonnull(NSString * _Nonnull obj, NSUInteger index) {
        return [NSString stringWithFormat:@"%@@%@", emailPrefix, obj];
    }];
}
@end
