//
//  NSArray+Collection
//  Login
//
//  Created by liuchang on 16/4/26.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import "NSArray+Collection.h"

@implementation NSArray (Map)
- (NSArray *)_mapWithBlock:(MapBlock)block {
    if (block == nil) {
        return nil; // or self?
    }
    
    NSMutableArray *array = [NSMutableArray array];
    [self enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
        id ret = block(obj, idx);
        if (ret != nil) {
            [array addObject:ret];
        }
    }];
    
    return array;
}

- (NSArray *)_filterWithBlock:(FilterBlock)block {
    if (block == nil) {
        return nil; // or self?
    }
    
    NSMutableArray *array = [NSMutableArray array];
    [self enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
        if (block(obj, idx)) {
            [array addObject:obj];
        }
    }];
    
    return array;
}

- (id)_reduceWithBlock:(ReduceBlock)block {
    if (block == nil) {
        return nil;
    }
    
    __block id ret = self.firstObject;
    
    NSArray *arr = [self _filterWithBlock:^BOOL(id  _Nonnull obj, NSUInteger index) {
        return index != 0;
    }];
                    
    [arr enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
        ret = block(ret, obj);
    }];
    
    return ret;
}
@end
