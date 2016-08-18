#!/usr/bin/env node

'use strict';
var util = require('../lib/util/util');
util.checkNodeVersion();
var main = require('../main');
var Args = require('../lib/util/args');
var splitChars = /[,;，；]/;

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
        var config = event.options || {};
        var id = (event.args || [])[0] || '';
        var action = 'update';
        config = this.format(action, config);
        config.action = action;
        if (id) {
            id.split(splitChars).forEach(function (it) {
                config.id = it;
                main.build(config);
            });
        } else {
            // update all project
            main.update(config);
        }
    },
    mock: function (event) {
        var action = 'mock';
        var config = event.options || {};
        var id = (event.args || [])[0];
        if (!id) {
            this.show(name);
            process.exit(0);
        }
        config = this.format(action, config);
        config.action = action;
        config.id = id;
        main.mock(config);
    },
    mobile: function (event) {
        var action = 'mobile';
        var config = event.options || {};
        var id = (event.args || [])[0];
        if (!id) {
            this.show(name);
            process.exit(0);
        }
        config = this.format(action, config);
        config.action = action;
        config.id = id;
        main.mobile(config);
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