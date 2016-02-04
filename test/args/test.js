'use strict';
let assert = require('assert');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let Args = require('../../lib/util/args');
const ARGS_CONFIG = require('../../bin/config.js');
const PACKAGE_JSON = require('../../package.json');

describe('nei/args', function () {

    describe('Args class method', function () {
        this.timeout(40000);

        let options;

        beforeEach(function () {
            options = {
                message: ARGS_CONFIG,
                package: PACKAGE_JSON
            };
        });

        it('Args exec `-v` -> case 1', function (done) {
            Object.assign(options, {
                exit: function (code) {
                    assert.equal(true, code === 0);
                },
                log: function (msg) {
                    assert.equal(true, msg.startsWith('Toolkit'));
                }
            });
            let args = new Args(options);
            args.exec(['-v']);

            done();
        });

        it('Args exec `-h` -> case 2', function (done) {
            Object.assign(options, {
                exit: function (code) {
                    assert.equal(true, code === 0);
                },
                log: function (msg) {
                    assert.equal(true, msg.indexOf('--version') !== -1);
                }
            });
            let args = new Args(options);
            args.exec(['-h']);

            done();
        });

        it('Args exec `build` without param -> case 3', function (done) {
            Object.assign(options, {
                build: function(event) {
                    assert.equal(true, event.args.length === 0);
                }
            });
            let args = new Args(options);
            args.exec(['build']);

            done();
        });

        it('Args exec `build` with param -> case 4', function (done) {
            Object.assign(options, {
                build: function(event) {
                    assert.equal(true, event.args[0] === '11029');
                    assert.equal(true, event.options.p === './project');
                }
            });
            let args = new Args(options);
            args.exec(['build', '11029', '-p', './project']);

            done();
        });

        it('Args exec `update` -> case 5', function (done) {
            Object.assign(options, {
                update: function(event) {
                    assert.equal(true, event.args[0] === '11029');
                    assert.equal(true, event.options.p === './project');
                }
            });
            let args = new Args(options);
            args.exec(['update', '11029', '-p', './project']);

            done();
        });

        it('Args exec `export` -> case 6', function (done) {
            Object.assign(options, {
                export: function(event) {
                    assert.equal(true, event.args[0] === '11029');
                    assert.equal(true, event.options.o === './project');
                }
            });
            let args = new Args(options);
            args.exec(['export', '11029', '-o', './project']);

            done();
        });

        it('Args exec `mobile` -> case 7', function (done) {
            Object.assign(options, {
                mobile: function(event) {
                    assert.equal(true, event.args[0] === '11029');
                    assert.equal(true, event.options.o === './project');
                }
            });
            let args = new Args(options);
            args.exec(['mobile', '11029', '-o', './project']);

            done();
        });

        it('Args `checkConfig(config)` -> case 8', function (done) {
            Object.assign(options, {
                exit: function (code) {
                    assert.equal(true, code === 1);
                }
            });
            let args = new Args(options);
            args.checkConfig({
                action: 'build',
                template: 'mobile',
                lang: 'oc',
                templateDataPath: ''
            });

            done();
        });

        it('Args `checkConfig(config)` -> case 9', function (done) {
            Object.assign(options, {
                exit: function (code) {
                    assert.equal(true, code === 1);
                }
            });
            let args = new Args(options);
            args.checkConfig({
                action: 'build',
                template: 'mobile',
                lang: 'java',
                templatePath: ''
            });

            done();
        });

        it('Args `format(key, data)` -> case 10', function (done) {
            let args = new Args(options);
            let config = args.format('build', {
                p: './project'
            });
            assert.equal(true, config.project === './project');
            assert.equal(true, config.template === 'webapp');
            assert.equal(true, config.overwrite === false);

            done();
        });

    });

});
