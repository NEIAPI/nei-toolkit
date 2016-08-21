/*
 * Handlebars 辅助函数集
 * @author huntbao
 */
'use strict';
let Handlebars = require('handlebars');

/**
 * 首字母大写
 */
Handlebars.registerHelper('capFirst', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});

/**
 * 不翻译被包裹的内容
 */
Handlebars.registerHelper('raw', function(options) {
    return options.fn();
});