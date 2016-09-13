//
//  NSArray+Collection.h
//  Login
//
//  Created by liuchang on 16/4/26.
//  Copyright © 2016年 Netease. All rights reserved.
//

#import <Foundation/Foundation.h>


NS_ASSUME_NONNULL_BEGIN
@interface NSArray<__covariant ObjectType> (Map)
typedef _Nonnull id (^MapBlock)(ObjectType obj, NSUInteger index);
typedef BOOL (^FilterBlock)(ObjectType obj, NSUInteger index);
typedef _Nonnull ObjectType (^ReduceBlock)(ObjectType firstObj, ObjectType secondObj);

- (NSArray<ObjectType> *)_mapWithBlock:(MapBlock)block;
- (NSArray<ObjectType> *)_filterWithBlock:(FilterBlock)block;
- (ObjectType)_reduceWithBlock:(ReduceBlock)block;
@end
NS_ASSUME_NONNULL_END