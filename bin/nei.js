'use strict';
if (process.version < 'v4.2.1') {
    console.log('请将Node更新至4.2.1及以上版本，可以使用nvm在本地安装并管理多个Node版本。');
    process.exit(1);
}
var main = require('../main');
var Args = require('../lib/util/args');
var splitChars = /[,;，；]/;

// run command for single id
var run = function (name, event) {
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
        run.call(this, 'mock', event);
    },
    mobile: function (event) {
        var opt = event.options || {};
        opt.action = 'mobile';
        this.format(opt.action, opt);
        run.call(this, opt.action, event);
    }
};

var args = new Args(options);
// do command
args.exec(process.argv.slice(2));