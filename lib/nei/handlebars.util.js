/*
 * Handlebars 辅助函数集
 * @author huntbao
 */
'use strict';
let Handlebars = require('handlebars');
let neiDbConst = require('../fb-modules/config/db.json');


/**
 * 不翻译被包裹的内容
 */
Handlebars.registerHelper('raw', function (options) {
    return options.fn();
});

/**
 * 一些逻辑运算: '=='、'==='、'<'、'<='、'>'、'>='、'&&'、'||'
 */
Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

/**
 * 获取以点号分隔字符串后的最后一项, 相当于根据路径取文件的扩展名
 */
Handlebars.registerHelper('extname', function (str) {
    return str.substr(str.lastIndexOf('.') + 1);
});

/**
 * 获取模型名称, 如果它是数组, 默认使用 `[]` 嵌套, 比如二维数组: String[][]
 * 或者使用 `List` 嵌套, 比如二维数组: List<List<String>>
 */
Handlebars.registerHelper('typeName', function (model, options) {
    var type;
    var arrDim;
    var useList;
    if (model.hasOwnProperty('type')) {
        // 模型中的用法: `{{typeName this useList=true}}`;
        type = model.type;
        arrDim = model.arrDim;
        if (options.hasOwnProperty('hash')) {
            useList = options.hash.useList;
        }
    } else if (model.hasOwnProperty('hash')) {
        // 接口返回参数中的用法: `{{typeName type=outputModel arrDim=outputModelArrDim useList=true}}`
        type = model.hash.type;
        arrDim = model.hash.arrDim;
        useList = model.hash.useList;
    }
    if (arrDim) {
        if (useList === true) {
            var name = [];
            var len = arrDim;
            while (len--) {
                name.push('List<');
            }
            name.push(type);
            len = arrDim;
            while (len--) {
                name.push('>');
            }
        } else {
            var name = [type];
            var len = arrDim;
            while (len--) {
                name.push('[]');
            }
        }
        return name.join('');
    } else {
        return type;
    }
});

/**
 * 中划线'-'转下划线'_'
 * a-b-c    >>>>    a_b_c
 * a---b-c  >>>>    a_b_c
 * --a-b--c-- >>>>    _a_b_c_
 */
Handlebars.registerHelper('hyphenToUnderline', function(str){
    return str.split(/-+/).join('_');
});

/**
 * 中划线'-'后的字符转大写
 * a-b-c        >>>>    ABC
 * a----b--c    >>>>    ABC
 *
 */
Handlebars.registerHelper('hyphenToCamel', function(str) {
    return str.split('-').map(x=>{
        return x.charAt(0).toUpperCase() + x.slice(1);
    }).join('');
});

/**
 * 首字母小写
 */
Handlebars.registerHelper('lowerFirst', function (str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
});

/**
 * 将换行替换为逗号(默认)或者自定义分隔符
 */
Handlebars.registerHelper('noLineBreak', function (str, options) {
    var sep = options.hash.sep || ',';
    return str.replace(/\n/g, sep);
});

/**
 * 格式化注释, 在每一行的前面添加 ` * `
 */
Handlebars.registerHelper('prettifyComment', function (str) {
    var lines = str.split('\n');
    return ' * ' + lines.join('\n * ');
});

/**
 * 首字母大写
 */
Handlebars.registerHelper('upperFirst', function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('iosProperty', function(datatype){
    let helper = function(field) {
        let noStar = null;
        let refName = null;
        if (field.itemIsArray) {
            noStar = 0;
            refName = 'strong';
        } else {
            switch (field.format) {
                case neiDbConst.MDL_FMT_NUMBER:
                case neiDbConst.MDL_FMT_BOOLEAN:
                    noStar = 1;
                    refName = "assign";
                    break;
                case neiDbConst.MDL_FMT_STRING:
                    refName = "copy";
                    noStar = 0;
                    break;
                case neiDbConst.MDL_FMT_HASH:
                    refName = "strong";
                    noStar = 0;
                    break;
                default:
                    break;
            }
        }
        let header= `/**\n *  ${field.description}\n */\n`;
        return header + `@property (nonatomic, ${refName}) ${field.type} ${noStar?"":"*"}${field.name};`
    };

    return datatype.fields&&datatype.fields.map(x=>{return helper(x)}).join('\n');
});

