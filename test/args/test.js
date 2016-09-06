'use strict';
let assert = require('assert');
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
                    assert.equal(true, event.options.k === 'xyz');
                }
            });
            let args = new Args(options);
            args.exec(['build', '-k', 'xyz']);

            done();
        });

        it('Args exec `update` -> case 5', function (done) {
            Object.assign(options, {
                update: function(event) {
                    assert.equal(true, event.options.k === 'xyz');
                }
            });
            let args = new Args(options);
            args.exec(['update', '-k', 'xyz']);

            done();
        });

        it('Args `format(key, data)` -> case 6', function (done) {
            let args = new Args(options);
            let config = args.format('build', {
                k: 'xyz'
            });
            assert.equal(true, config.key === 'xyz');
            assert.equal(true, config.overwrite === undefined);

            // 设置默认值
            config = args.format('build', {
                k: 'xyz'
            }, true);

            assert.equal(true, config.overwrite === false);
            done();
        });

        it('Args `parse(argv)` -> case 7', function (done) {
            let args = new Args(options);
            let argsArr = ['build', '-o', '/path/to/output/'];
            let result = args.parse(argsArr);
            assert.equal('build', result.command);
            assert.equal('/path/to/output/', result.options.o);
            assert.equal(true, Array.isArray(result.args));
            assert.equal(0, result.args.length);

            done();
        });

        it('Args `parse(argv)` -> case 8', function (done) {
            let args = new Args(options);
            let argsArr = ['build', 'file.js', '-o', '/path/to/output/'];
            let result = args.parse(argsArr);
            assert.equal('build', result.command);
            assert.equal('/path/to/output/', result.options.o);
            assert.equal(true, Array.isArray(result.args));
            assert.equal('file.js', result.args[0]);

            done();
        });

        it('Args `params(key)` -> case 9', function (done) {
            let args = new Args(options);
            let result = args.params('key is not exist');
            assert.equal('', result);

            done();
        });

        it('Args `params(key)` -> case 10', function (done) {
            let args = new Args(options);
            let result = args.params('-default').split('\n');
            assert.equal('-v, --version\t\t显示工具版本信息', result[0]);
            assert.equal('-h, --help\t\t显示指定命令的帮助信息', result[1]);

            done();
        });

    });

});
