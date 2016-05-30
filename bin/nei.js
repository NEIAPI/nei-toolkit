#!/usr/bin/env node

'use strict';
if (process.version < 'v4.2.1') {
    console.log('请将Node更新至4.2.1及以上版本，可以使用nvm在本地安装并管理多个Node版本。');
    process.exit(1);
}

var main = require('../main');
var Args = require('../lib/util/args');
var splitChars = /[,;，；]/;

var options = {
    message: require('./config.js'),
    package: require('../package.json'),
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
        var id = (event.args || [])[0];
        config = this.format(action, config);
        config.action = action;

        // if id is "0", enter into offline mode
        if(id === "0") {
            main.build(config);
        }
        else
        if (!id) {
            if (config.template === 'mobile') {
                // build empty mobile project
                main.buildEmpty(config);
            } else {
                this.show(action);
                this.emit('exit', 0);
            }
        } else {
            id.split(splitChars).forEach(function (it) {
                config.id = it;
                main.build(config);
            });
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
        var id = (event.args || [])[0];
        config = this.format(action, config);
        config.action = action;
        config.id = id;
        main.server(config);
    },
    // alias for server
    serve: function (event) {
        options.server.call(this, event);
    }
};

var args = new Args(options);
// do command
args.exec(process.argv.slice(2));