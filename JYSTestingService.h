//
//  {{args.modulePrefix}}{{args.moduleName}}{{args.modulePostfix}}.h
//  Pods
//
//  Created by {{args.author}}.
//
//

{{#each args.serviceClass.imports}}{{{this}}}{{/each}}

@interface {{args.modulePrefix}}{{args.moduleName}}{{args.modulePostfix}} : {{args.serviceClass.baseClass}}

@end
