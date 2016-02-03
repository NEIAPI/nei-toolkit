#!/usr/bin/env node

'use strict';
if (process.version < 'v4.2.1') {
    console.log('请将Node更新至4.2及以上版本，可以使用nvm安装并管理多个Node版本。');
    process.exit(1);
}
var main = require('../main.js');
var Args = require('../lib/util/args.js');
var splitChars = /[,;，；]/;

// run command for single id
var run = function (name, event) {
    event.stopped = true;
    var opt = event.options || {};
    var id = (event.args || [])[0];
    if (!id) {
        this.show(name);
        process.exit(0);
    } else {
        opt.id = id;
        this.format(name, opt);
        main[name](opt);
    }
};
// run command for batch ids
var batch = function (name, event) {
    event.stopped = true;
    var opt = event.options || {};
    var id = (event.args || [])[0] || '';
    if (!id) {
        this.show(name);
        process.exit(0);
    } else {
        this.format(name, opt);
        id.split(splitChars).forEach(function (it) {
            opt.id = it;
            main[name](opt);
        });
    }
};
// do command
var options = {
    message: require('./nei.json'),
    package: require('../package.json'),
    msg: function () {
        process.exit(0);
    },
    build: function (event) {
        event.stopped = true;
        var opt = event.options || {};
        var id = (event.args || [])[0];
        if (!id) {
            this.show('build');
            process.exit(0);
        } else {
            opt.action = 'build';
            this.format(opt.action, opt);
            id.split(splitChars).forEach(function (it) {
                opt.id = it;
                main.nei(opt, this);
            });
        }
    },
    update: function (event) {
        event.stopped = true;
        var opt = event.options || {};
        var id = (event.args || [])[0] || '';
        opt.action = 'update';
        this.format(opt.action, opt);
        if (!!id) {
            id.split(splitChars).forEach(function (it) {
                opt.id = it;
                main.nei(opt);
            });
        } else {
            // update all project
            main.update(opt);
        }
    },
    export: function (event) {
        batch.call(this, 'export', event);
    },
    mock: function (event) {
        run.call(this, 'mock', event);
    },
    mobile: function (event) {
        event.stopped = true;
        var opt = event.options || {};
        opt.action = 'mobile';
        this.format(opt.action, opt);
        run.call(this, opt.action, event);
    }
};
var args = new Args(options);
args.exec(process.argv.slice(2));