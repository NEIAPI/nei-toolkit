//
//  TabBarItem.h
//  
//
//  Created by Bai tianyu on 1/18/16.
//  Copyright © 2016 Netease. All rights reserved.
//

#import "HTSegmentsView.h"

@interface TabBarItem : HTSegmentsCellView

- (instancetype)initWithTitle:(NSString*)title
                         icon:(NSString*)icon
                 selectedIcon:(NSString*)selectedIcon;

@end
