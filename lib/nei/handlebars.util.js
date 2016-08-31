/*
 * Handlebars 辅助函数集
 * @author huntbao
 */
'use strict';
let Handlebars = require('handlebars');

/**
 * 不翻译被包裹的内容
 */
Handlebars.registerHelper('raw', function(options) {
    return options.fn();
});
/**
 * 首字母大写
 */
Handlebars.registerHelper('upperFirst', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});
/**
 * 首字母小写
 */
Handlebars.registerHelper('lowerFirst', function(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
});
/**
 * 获取模型的名称, 如果它是数组, 则使用 `List` 嵌套, 比如二维数组: List<List<String>>
 */
Handlebars.registerHelper('modelNameByList', function(model) {
    if (model.arrDim) {
        var name = [];
        var len = model.arrDim;
        while (len--) {
            name.push('List<');
        }
        name.push(model.type);
        len = model.arrDim;
        while (len--) {
            name.push('>');
        }
        return name.join('');
    } else {
        return model.type;
    }
});
/**
 * 获取模型的名称, 如果它是数组, 则使用 `[]` 嵌套, 比如二维数组: String[][]
 */
Handlebars.registerHelper('modelNameByBracket', function(model) {
    if (model.arrDim) {
        var name = [model.type];
        var len = model.arrDim;
        while (len--) {
            name.push('[]');
        }
        return name.join('');
    } else {
        return model.type;
    }
});
/**
 * 格式化注释, 在每一行的前面添加 ` * `
 */
Handlebars.registerHelper('prettifyComment', function(str) {
    var lines = str.split('\n');
    return ' * ' + lines.join('\n * ');
});
/**
 * 将换行替换为逗号
 */
Handlebars.registerHelper('noLineBreak', function(str) {
    return str.replace(/\n/g, ',');
});