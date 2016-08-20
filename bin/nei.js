#!/usr/bin/env node

'use strict';
var util = require('../lib/util/util');
util.checkNodeVersion();
var main = require('../main');
var Args = require('../lib/util/args');

var options = {
    package: require('../package.json'),
    message: require('./config.js'),
    exit: function (code) {
        if (typeof(code) === 'undefined') {
            code = 0;
        }
        process.exit(code);
    },
    log: function (msg) {
        console.log(msg);
    },
    build: function (event) {
        var action = 'build';
        var config = event.options || {};
        config = this.format(action, config);
        if (!config.key) {
            this.log(`错误: 缺少项目的唯一标识 key, 请到 NEI 网站上的相应项目的"工具设置"中查看该 key 值`);
            this.show(action);
        } else {
            main.build(this, action, config);
        }
    },
    update: function (event) {
        var action = 'update';
        var config = event.options || {};
        config = this.format(action, config);
        if (config.key) {
            main.build(this, action, config);
        } else {
            main.update(this, action, config);
        }
    },
    server: function (event) {
        var action = 'server';
        var config = event.options || {};
        config = this.format(action, config);
        config.action = action;
        main.server(config);
    }
};

var args = new Args(options);
// do command
args.exec(process.argv.slice(2));