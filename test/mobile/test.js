'use strict';
let assert = require('assert');
let fs = require('fs');
let path = require('path');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let MobileOCBuilder = require('../../lib/nei/mobile.oc');
let MobileJavaBuilder = require('../../lib/nei/mobile.java');
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
            _fs.rmdir(outputRoot);
        });

        it('Build OC project -> case 1', function (done) {
            let config = {
                config: './project_template/iostpl/build.json'
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
            config.outputRoot = _path.normalize(_path.absolute(config.project + '/', cwd));
            let builder = new MobileOCBuilder(config);
            builder.build(getTestDataCopy());

            let projectName = 'Yanxuan';

            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/JSON/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/${projectName}/info.plist`));

            let projectFilePath = `${outputRoot}/${projectName}`;
            let pbxProj = new PbxProj(projectName, projectFilePath);
            let rootGroup = pbxProj.getPBXGroupByPath(true, projectName);

            // root group has 9 resources(files plus directories)
            assert.equal(9, rootGroup.group.children.length);

            let commonGroup = pbxProj.getPBXGroupByPath(false, 'Common', rootGroup.group);

            // Network
            assert.equal(1, commonGroup.group.children.length);

            let networkGroup = pbxProj.getPBXGroupByPath(false, 'Network', commonGroup.group);

            // Models & Requests
            assert.equal(2, networkGroup.group.children.length);

            let modelsGroup = pbxProj.getPBXGroupByPath(false, 'Models', networkGroup.group);
            let requestsGroup = pbxProj.getPBXGroupByPath(false, 'Requests', networkGroup.group);

            // Models 的个数规则较复杂：所有的枚举会合在一起，还会排除有 `Variable` 属性的数据类型
            let ret = builder.splitDataType();
            // 1 个文件包含所有的枚举类型，再减去 4 个基本类型
            assert.equal((1 + ret.models.length - 4) * 2 + 1, modelsGroup.group.children.length);
            assert.equal(testData.interfaces.length * 2 + 1, requestsGroup.group.children.length);

            done();
        });

    });

    describe('Build Java project', function () {
        this.timeout(40000);

        const outputRoot = `${_path.normalize(__dirname + '/')}javaproject/`;

        afterEach(function () {
            _fs.rmdir(outputRoot);
        });

        it('Build Java project -> case 1', function (done) {
            let config = {
                config: './project_template/javatpl/build.json'
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
            config.outputRoot = _path.normalize(_path.absolute(config.project + '/', cwd));
            let builder = new MobileJavaBuilder(config);
            builder.build(getTestDataCopy());

            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/JSON/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/app/src/main/hthttp-gen/com/google/template/hthttp/httptask/AddAddressInfoCase2HttpTask.java`));
            assert.equal(true, _fs.exist(`${outputRoot}/app/src/main/hthttp-gen/com/google/template/hthttp/model/Address.java`));

            done();
        });

    });
});
