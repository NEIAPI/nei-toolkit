//
//  {{Prefix}}TabBarController.m 
//  {{ProductName}}
//
//  Created by Bai tianyu on 1/14/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "{{Prefix}}TabBarController.h"
#import "HTSegmentsView.h"
#import "MCBlurView.h"
#import "HTContainerViewController.h"
#import "HTNavigationController.h"
#import "{{Prefix}}TabBarItem.h"
#import "UIImage+ImageWithColor.h"

@interface {{Prefix}}TabBarController ()<HTSegmentsViewDelegate, HTSegmentsViewDatasource>

@property (nonatomic, strong) HTSegmentsView *segmentsTabbar;
@property (nonatomic, strong) MCBlurView *bgView;

@property (nonatomic, strong) NSArray *titles;
@property (nonatomic, strong) NSArray *icons;
@property (nonatomic, strong) NSArray *selectedIcons;

@end


@implementation {{Prefix}}TabBarController

#pragma mark - Life cycle.

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        [self loadTabbar];
        [self loadViewControllers];
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)viewWillAppear:(BOOL)animated {
    [self clearUITabbarItem];
    [super viewWillAppear:animated];
}

- (void)viewWillLayoutSubviews {
    [super viewWillLayoutSubviews];
    _segmentsTabbar.frame = self.tabBar.bounds;
    _bgView.frame = self.tabBar.bounds;
}


#pragma mark - Load views.

- (void)loadTabbar {
    // You should custom the tabbar's content by yourself.
    _titles = @[NSLocalizedString(@"tab1", nil),
                NSLocalizedString(@"tab2", nil),
                NSLocalizedString(@"tab2", nil)];
    _icons = @[@"",@"", @""];
    _selectedIcons = @[@"",@"", @""];
    
    // Load tabbar item.
    [self loadSegmentsView];
}

- (void)loadSegmentsView {
    _bgView = [[MCBlurView alloc] initWithStyle:MCBlurStyleWhite];
    [self.tabBar addSubview:_bgView];
    
    _segmentsTabbar = [[HTHorizontalSegmentsView alloc] initWithDataSource:self delegate:self];
    _segmentsTabbar.backgroundColor = [UIColor clearColor];
    [self.tabBar addSubview:_segmentsTabbar];
}

- (void)clearUITabbarItem {
    //清理原来的tabbar的内容
    for (UIView *subView in self.tabBar.subviews) {
        if ([subView isKindOfClass:MCBlurView.class] ||
            [subView isKindOfClass:HTHorizontalSegmentsView.class] ||
            CGRectGetHeight(subView.frame) <= 1 ||
            [subView isKindOfClass:[UIImageView class]]) {
            continue;
        }
        
        subView.hidden = YES;
        subView.alpha = 0;
    }
    self.tabBar.backgroundImage = [UIImage imageWithColor:[UIColor clearColor]];
}

/*!
 Load tabs. You can add your own tab or remove the exist tabs.
 */
- (void)loadViewControllers {
    NSMutableArray *tabViewControllers = [[NSMutableArray alloc] init];

    // First tab
    UIViewController *tab1 = [[UIViewController alloc] init];
    HTContainerViewController *containerController = [[HTContainerViewController alloc] initWithRootViewController:tab1];
    tab1.view.backgroundColor = [UIColor whiteColor];
    // Hide the navigationbar.
    [[containerController rootNavigationController] setNavigationBarHidden:YES animated:NO];
    [tabViewControllers addObject:containerController];
    
    // Second tab
    UIViewController *tab2 = [[UIViewController alloc] init];
    tab2.view.backgroundColor = [UIColor whiteColor];
    containerController = [[HTContainerViewController alloc] initWithRootViewController:tab2];
    [tabViewControllers addObject:containerController];
    
    // Third tab
    UIViewController *tab3 = [[UIViewController alloc] init];
    tab3.view.backgroundColor = [UIColor yellowColor];
    containerController = [[HTContainerViewController alloc] initWithRootViewController:tab3];
    [tabViewControllers addObject:containerController];
    
    self.viewControllers = tabViewControllers;
}


#pragma mark - HTSegmentsViewDelegate

- (BOOL)segmentsView:(HTSegmentsView*)segmentsView shouldSelectedAtIndex:(NSUInteger)index {
    BOOL shouldSelected = YES;

    if ([self.delegate respondsToSelector:@selector(tabBarController:shouldSelectViewController:)]) {
        shouldSelected = [self.delegate tabBarController:self shouldSelectViewController:self.viewControllers[index]];
    }
    return shouldSelected;
}

- (void)segmentsView:(HTSegmentsView*)segmentsView didSelectedAtIndex:(NSUInteger)index {
    [super setSelectedIndex:index];

    if ([self.delegate respondsToSelector:@selector(tabBarController:didSelectViewController:)]) {
        [self.delegate tabBarController:self didSelectViewController:self.viewControllers[index]];
    }
}


#pragma mark - HTSegmentsViewDatasource

- (NSUInteger)numberOfCellsInSegementsView:(HTSegmentsView*)segmentsView {
    return _titles.count;
}

- (HTSegmentsCellView*)segmentsView:(HTSegmentsView*)segmentsView cellForIndex:(NSUInteger)index {
    {{Prefix}}TabBarItem *itemCell = [[{{Prefix}}TabBarItem alloc] initWithTitle:_titles[index]
                                                                icon:_icons[index]
                                                        selectedIcon:_selectedIcons[index]];
    return itemCell;
}

- (CGSize)segmentsView:(HTSegmentsView*)segmentsView cellSizeForIndex:(NSUInteger)index {
    CGFloat screenWidth = CGRectGetWidth([UIScreen mainScreen].bounds);
    return CGSizeMake(screenWidth/_titles.count, CGRectGetHeight(self.tabBar.bounds));
}

@end
