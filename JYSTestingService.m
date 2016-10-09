//
//  {{args.modulePrefix}}{{args.moduleName}}{{args.modulePostfix}}.m
//  Pods
//
//  Created by {{args.author}}.
//
//

#import "{{args.modulePrefix}}{{args.moduleName}}{{args.modulePostfix}}.h"

{{#each datatypes}}
#import "{{args.modulePrefix}}{{args.moduleName}}M{{{name}}}.h"
{{/each}}

#import "JYSFMForum.h"
#import "JYSFMForumBoard.h"
#import "JYSFMForumPermission.h"
#import "JYSFMPagination.h"
#import "JYSFMPost.h"
#import "JYSFMReply.h"

{{#each args.serviceClass.imports_imp}}
{{{this}}}
{{/each}}

@interface {{args.modulePrefix}}{{args.moduleName}}{{args.modulePostfix}} ()

@end

@implementation {{args.modulePrefix}}{{args.moduleName}}{{args.modulePostfix}}

- (void)setupService {
    // 修改这个函数来对Service进行初始化相关的配置
}

@end
