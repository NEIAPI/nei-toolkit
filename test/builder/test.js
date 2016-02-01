'use strict';
let should = require('should');
let assert = require('assert');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let Builder = require('../../lib/nei/builder');
let testData = require('../test_data');

describe('nei/builder', function () {

    // 在测试过程中，测试数据会被更改，所以每个测试用例都使用原始数据的拷贝
    let getTestDataCopy = function () {
        return JSON.parse(JSON.stringify(testData));
    };

    // project id of test data
    const pid = 11029;

    describe('Mock data', function () {
        this.timeout(40000);

        const outputRoot = `${_path.normalize(__dirname + '/')}mock/`;

        afterEach(function () {
            _fs.rmdir(outputRoot);
        });

        it('Mock data -> case 1', function (done) {
            let config = {
                id: pid,
                type: 0,
                fiddler: true,
                charles: true,
                outputRoot: outputRoot
            };
            let builder = new Builder(config);
            builder.mock(getTestDataCopy());

            assert.equal(true, _fs.exist(`${outputRoot}/api`));
            assert.equal(true, _fs.exist(`${outputRoot}/meta`));
            assert.equal(true, _fs.exist(`${outputRoot}/views`));
            assert.equal(true, _fs.exist(`${outputRoot}/charles.${pid}.xml`));
            assert.equal(true, _fs.exist(`${outputRoot}/fiddler.${pid}.farx`));

            done();
        });

        it('Mock data ->  case 2', function (done) {
            let config = {
                id: pid,
                type: 1,
                fiddler: false,
                charles: false,
                outputRoot: outputRoot
            };
            let builder = new Builder(config);
            builder.mock(getTestDataCopy());

            assert.equal(false, _fs.exist(`${outputRoot}/api`));
            assert.equal(true, _fs.exist(`${outputRoot}/meta`));
            assert.equal(false, _fs.exist(`${outputRoot}/views`));
            assert.equal(false, _fs.exist(`${outputRoot}/charles.${pid}.xml`));
            assert.equal(false, _fs.exist(`${outputRoot}/fiddler.${pid}.farx`));

            done();
        });

        it('Mock data -> case 3', function (done) {
            let config = {
                id: pid,
                type: 2,
                fiddler: false,
                charles: false,
                outputRoot: outputRoot
            };
            let builder = new Builder(config);
            builder.mock(getTestDataCopy());

            assert.equal(false, _fs.exist(`${outputRoot}/api`));
            assert.equal(true, _fs.exist(`${outputRoot}/meta`));
            assert.equal(false, _fs.exist(`${outputRoot}/views`));
            assert.equal(false, _fs.exist(`${outputRoot}/charles.${pid}.xml`));
            assert.equal(false, _fs.exist(`${outputRoot}/fiddler.${pid}.farx`));

            done();
        });
    });

    describe('Export data', function () {
        this.timeout(40000);

        const outputRoot = `${_path.normalize(__dirname + '/')}export/`;

        afterEach(function () {
            _fs.rmdir(outputRoot);
        });

        it('Export data -> case 1', function (done) {
            let config = {
                id: pid,
                outputRoot: outputRoot
            };
            let builder = new Builder(config);
            builder.export(getTestDataCopy());

            assert.equal(true, _fs.exist(`${outputRoot}/nei-${pid}-postman.json`));

            done();
        });

    });


});