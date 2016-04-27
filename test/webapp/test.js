'use strict';
let assert = require('assert');
let fs = require('fs');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let WebAppBuilder = require('../../lib/nei/webapp');
let testData = require('../test_data.json');

describe('nei/webapp', function () {
    // 在测试过程中，测试数据会被更改，所以每个测试用例都使用原始数据的拷贝
    let getTestDataCopy = function () {
        return JSON.parse(JSON.stringify(testData));
    };

    // project id of test data
    const pid = 11029;

    describe('Build webapp', function () {
        this.timeout(40000);

        const outputRoot = `${_path.normalize(__dirname + '/')}project/`;

        afterEach(function () {
            _fs.rmdir(outputRoot);
        });

        it('Build webapp -> case 1', function (done) {
            let config = {
                id: pid,
                outputRoot: outputRoot,
                mcss: true
            };
            let builder = new WebAppBuilder(config);
            builder.build(getTestDataCopy());

            assert.equal(true, _fs.exist(`${outputRoot}/deploy/release.${pid}.conf`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/JSON/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/server.bat`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/server.sh`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/mcss.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/bower.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/.bowerrc`));

            done();
        });

        it('Build and update webapp -> case 1', function (done) {
            let config = {
                id: pid,
                outputRoot: outputRoot,
                mcss: true
            };
            let builder = new WebAppBuilder(config);
            builder.build(getTestDataCopy());

            assert.equal(true, _fs.exist(`${outputRoot}/deploy/release.${pid}.conf`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/JSON/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/server.bat`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/server.sh`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/mcss.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/bower.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/.bowerrc`));

            let testData = getTestDataCopy();
            let firstCustomDataType = testData.datatypes.find(function (dt) {
                return dt.id > 10003;
            });
            // change description for diff test
            firstCustomDataType.name += 'Test';
            config = {
                id: pid,
                outputRoot: outputRoot
            };
            builder = new WebAppBuilder(config);
            builder.update(testData);

            let files = fs.readdirSync(`${outputRoot}/nei.${pid}/JSON/`);
            assert.equal(4, files.length);

            let diffFile = files.find(function (f) {
                return f.indexOf('diff') > 0;
            });

            assert.equal(true, _fs.read(`${outputRoot}/nei.${pid}/JSON/${diffFile}`).length > 0);

            done();
        });

    });
});
