'use strict';
let assert = require('assert');
let fs = require('fs');
let path = require('path');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let MobileOCBuilder = require('../../lib/nei/mobile.oc');
let PbxProj = require('../../lib/nei/mobile.oc.pbx');
let Args = require('../../lib/util/args');
let testData = require('../test_data');

describe('nei/mobile', function () {
    // 在测试过程中，测试数据会被更改，所以每个测试用例都使用原始数据的拷贝
    let getTestDataCopy = function () {
        return JSON.parse(JSON.stringify(testData));
    };

    // project id of test data
    const pid = 11029;

    describe('Build OC project', function () {
        this.timeout(40000);

        const outputRoot = `${_path.normalize(__dirname + '/')}ocproject/`;

        afterEach(function () {
            //_fs.rmdir(outputRoot);
        });

        it('Build OC project -> case 1', function (done) {
            let config = {
                config: './iostpl/build.json'
            };
            let options = {
                message: require('../../bin/config'),
                package: require('../../package.json')
            };
            let args = new Args(options);

            config = args.format('build', config);
            config.action = 'build';
            config.id = pid;
            config.project = outputRoot;

            let cwd = process.cwd() + '/';
            config.outputRoot = _path.absolute(config.project + '/', cwd);

            let builder = new MobileOCBuilder(config);
            builder.build(getTestDataCopy());

            let projectName = 'Yanxuan';

            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/JSON/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/${projectName}/info.plist`));
            assert.equal(true, _fs.exist(`${outputRoot}/${projectName}/Common/Network/Models/HTAddress.h`));
            assert.equal(true, _fs.exist(`${outputRoot}/${projectName}/Common/Network/Requests/HTAddAddressInfo.h`));

            let projectFilePath = `${outputRoot}/${projectName}`;
            let pbxProj = new PbxProj(projectName, projectFilePath);
            let rootGroup = pbxProj.getPBXGroupByPath(true, projectName);

            assert.equal(103, rootGroup.group.children.length);

            done();
        });


    });
});
