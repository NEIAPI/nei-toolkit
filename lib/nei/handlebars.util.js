/*
 * Handlebars 辅助函数集
 * @author huntbao
 */
'use strict';
let Handlebars = require('handlebars');

Handlebars.registerHelper('capFirst', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});