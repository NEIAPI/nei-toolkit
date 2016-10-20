/*
 * Handlebars 辅助函数集
 * @author huntbao
 */
'use strict';
let Handlebars = require('handlebars');
let neiDbConst = require('../fb-modules/config/db.json');


/**
 * 不翻译被包裹的内容
 * @param {Object} options
 *
 *
 */
function raw(options) {
    return options.fn();
}

Handlebars.registerHelper('raw', raw);

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
 * @param {string} str
 * @return {string}
 *
 * @example
 *      Handlebars.compile('{{extname "hello.js"}}')() // => "js"
 *      Handlebars.compile('{{extname "hellojs"}}')() // => ""
 *      Handlebars.compile('{{extname "hellojs."}}')() // => ""
 *      Handlebars.compile('{{extname "hello.util.js"}}')() // => "js"
 */
function extname(str) {
    return str.substr(str.lastIndexOf('.')).substr(1);
}
Handlebars.registerHelper('extname', extname);

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
 * 中划线'-' 转下划线'_'
 * @param {string} str
 * @return {string}
 *
 * @example
 *      Handlebars.compile('{{hyphenToUnderline "a---b-c"}}')() // => "a_b_c"
 *      Handlebars.compile('{{hyphenToUnderline "---a-b-c"}}')() // => "_a_b_c"
 *      Handlebars.compile('{{hyphenToUnderline "a-b-c--"}}')() // => "a_b_c_"
 */
function hyphenToUnderline(str) {
    return str.split(/-+/).join('_');
}
Handlebars.registerHelper('hyphenToUnderline', hyphenToUnderline);

/**
 * 中划线'-'后的字符转大写
 * @param {string} str
 * @return {string}
 * @example
 *      Handlebars.compile('{{hyphenToCamel "--a-b-c--"}}')() // => "ABC"
 *      Handlebars.compile('{{hyphenToCamel "a---b---c"}}')() // => "ABC"
 *
 */
function hyphenToCamel(str) {
    return str.split('-').map(x=> {
        return x.charAt(0).toUpperCase() + x.slice(1);
    }).join('');
}
Handlebars.registerHelper('hyphenToCamel', hyphenToCamel);

/**
 * hyphenToCamel的反函数，将大写字符转为小写并以中划线'-'分开
 * @param {string} str
 * @return {string}
 *
 * @example
 *      Handlebars.compile('{{camelToHyphen "AbcDefGhi"}}')() // => "abc-def-ghi"
 *      Handlebars.compile('{{camelToHyphen "abcDEF"}}')() // => "abc-d-e-f"
 *      Handlebars.compile('{{camelToHyphen "abc--DEF"}}')() // => "abc-d-e-f"
 *      Handlebars.compile('{{camelToHyphen "abc--DEF--"}}')() // => "abc-d-e-f-"
 *
 */
function camelToHyphen(str) {
    return str.split(/([A-Z][^A-Z]*)/g).filter(x=> {
        return x != ''
    })
        .map(x=> {
            return x.toLowerCase()
        }).join('-').replace(/-+/g, '-');
}
Handlebars.registerHelper('camelToHyphen', camelToHyphen);

/**
 * 首字母小写
 * @param {string} str
 * @return {string}
 *
 * @example
 *      Handlebars.compile('{{lowerFirst "abcDEF"}}')() // => "abcDEF"
 *      Handlebars.compile('{{lowerFirst "AbcDEF"}}')() // => "abcDEF"
 *      Handlebars.compile('{{lowerFirst "-AbcDEF"}}')() // => "-AbcDEF"
 *      Handlebars.compile('{{lowerFirst "A"}}')() // => "a"
 *      Handlebars.compile('{{lowerFirst ""}}')() // => ""
 */
function lowerFirst(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
Handlebars.registerHelper('lowerFirst', lowerFirst);

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
 * @param {string} str
 * @return {string}
 *
 * @example
 *      Handlebars.compile('{{upperFirst "abcDEF"}}')() // => "AbcDEF"
 *      Handlebars.compile('{{upperFirst "AbcDEF"}}')() // => "AbcDEF"
 *      Handlebars.compile('{{upperFirst "-abcDEF"}}')() // => "-abcDEF"
 *      Handlebars.compile('{{upperFirst "a"}}')() // => "A"
 *      Handlebars.compile('{{upperFirst ""}}')() // => ""

 */
function upperFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
Handlebars.registerHelper('upperFirst', upperFirst);

Handlebars.registerHelper('iosProperty', function (datatype, options) {
    let isObject = function (obj) {
        return ({}).toString.call(obj).toLowerCase() === '[object object]';
    };
    let helper = function (field, prefix) {
        let noStar = null;
        let refName = null;
        let type;
        if (field.format === neiDbConst.MDL_FMT_HASH && options.hash.hasPrefix) {
            type = prefix + field.type;
        } else {
            type = field.type;
        }
        if (field.itemIsArray || field == undefined) {
            noStar = 0;
            refName = 'strong';
            /**
             * 规则:
             * 取数组元素的类型, 如果是多维数组, 则取最终一层的元素类型。
             * a. 如果元素类型不是数组:
             *      1. 如果数组元素的类型为 Number 或者 Boolean, 那么需要转为 NSNumber，类型格式为：NSArray<${prefix}NSNumber *>；
             *      2. 否则类型格式为：NSArray<${prefix}${field.type} *>。
             * b. 否则类型格式为：NSArray
             * */
            if (options.hash.datatypes) {
                // 取数组元素的类型, 如果是多维数组, 则取最终一层的元素类型
                let arrEleDatatype = options.hash.datatypes.find((dt) => dt.name === field.originalType);
                if (arrEleDatatype.format !== neiDbConst.MDL_FMT_ARRAY) {
                    // 如果元素类型不是数组:
                    // 1. 如果数组元素的类型为 Number 或者 Boolean, 那么需要转为 NSNumber
                    if (arrEleDatatype.format === neiDbConst.MDL_FMT_BOOLEAN || arrEleDatatype.format === neiDbConst.MDL_FMT_NUMBER) {
                        type = `NSArray<${prefix}NSNumber *>`;
                    } else {
                        // 2. 否则使用下述形式
                        type = `NSArray<${prefix}${field.type} *>`;
                    }
                } else {
                    type = 'NSArray';
                }
            }
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
        let header = `/**\n *  ${field.description}\n */\n`;
        return header + `@property (nonatomic, ${refName}) ${type} ${noStar ? "" : "*"}${field.name};`
    };

    if (isObject(datatype)) {
        return new Handlebars.SafeString(datatype.fields && datatype.fields.map(x=> {
                return helper(x, this.args.prefix);
            }).join('\n'));
    } else if (Array.isArray(datatype)) {
        return new Handlebars.SafeString(datatype.map(x=> {
            return helper(x, this.args.prefix);
        }).join('\n'));
    }
});

/**
 * 把 json 对象转为 string 形式
 */
Handlebars.registerHelper('JSONStringify', function (obj) {
    return JSON.stringify(obj, null, '\t');
});
