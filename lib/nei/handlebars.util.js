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