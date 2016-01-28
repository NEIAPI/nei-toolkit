#!/usr/bin/env node

'use strict';

let main = require('../main.js');
let Args = require('../lib/util/args.js');
let splitChars = /[,;，；]/;

// run command for single id
let run = function (name, event) {
    let opt = event.options || {};
    let id = (event.args || [])[0];
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
let batch = function (name, event) {
    let opt = event.options || {};
    let id = (event.args || [])[0] || '';
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

let options = {
    message: require('./nei.json'),
    package: require('../package.json'),
    exit: function () {
        process.exit(0);
    },
    build: function (event) {
        let opt = event.options || {};
        let id = (event.args || [])[0];
        if (!id) {
            this.show('build');
            process.exit(0);
        } else {
            opt.action = 'build';
            this.format(opt.action, opt);
            id.split(splitChars).forEach((it) => {
                opt.id = it;
                main.build(opt, this);
            });
        }
    },
    update: function (event) {
        let opt = event.options || {};
        let id = (event.args || [])[0] || '';
        opt.action = 'update';
        this.format(opt.action, opt);
        if (id) {
            id.split(splitChars).forEach(function (it) {
                opt.id = it;
                main.build(opt);
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
        let opt = event.options || {};
        opt.action = 'mobile';
        this.format(opt.action, opt);
        run.call(this, opt.action, event);
    }
};

let args = new Args(options);
// do command
args.exec(process.argv.slice(2));