'use strict';
let assert = require('assert');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let Builder = require('../../lib/nei/builder');
let testData = require('../test_data.json');

describe('nei/builder', function () {

    // 在测试过程中，测试数据会被更改，所以每个测试用例都使用原始数据的拷贝
    let getTestDataCopy = function () {
        return JSON.parse(JSON.stringify(testData));
    };

    describe('Builder', function () {
        this.timeout(40000);

        const outputRoot = `${_path.normalize(__dirname + '/')}webpro/`;

        afterEach(function () {
            _fs.rmdir(outputRoot);
        });

        it('builder -> case 1', function (done) {
            let ds = getTestDataCopy();
            let args = {
                output: './webpro',
                overwrite: true
            }
            let config = {
                action: 'build',
                outputRoot: outputRoot,
                neiConfigRoot: `${outputRoot}nei.${ds.project.id}/`,
                pid: ds.project.id
            }
            new Builder({
                config: config,
                args: args,
                ds: ds
            });

            assert.equal(true, _fs.exist(`${outputRoot}/deploy`));
            assert.equal(true, _fs.exist(`${outputRoot}/doc`));
            assert.equal(true, _fs.exist(`${outputRoot}/mock.data`));

            assert.equal(true, _fs.exist(`${outputRoot}/mock.data/interface/delete`));
            assert.equal(true, _fs.exist(`${outputRoot}/mock.data/interface/get`));
            assert.equal(true, _fs.exist(`${outputRoot}/mock.data/interface/post`));
            assert.equal(true, _fs.exist(`${outputRoot}/mock.data/interface/put`));

            assert.equal(true, _fs.exist(`${outputRoot}/mock.data/template/page/detail.js`));

            assert.equal(true, _fs.exist(`${outputRoot}/nei.11443/json/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.11443/nei.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.11443/server.config.js`));

            assert.equal(true, _fs.exist(`${outputRoot}/public`));
            assert.equal(true, _fs.exist(`${outputRoot}/public/src/page/pages/index.js`));

            assert.equal(true, _fs.exist(`${outputRoot}/server/controller/vo/Todo.java`));

            assert.equal(true, _fs.exist(`${outputRoot}/view/pages/index.ftl`));

            assert.equal(true, _fs.exist(`${outputRoot}/.gitignore`));
            assert.equal(true, _fs.exist(`${outputRoot}/app.js`));
            assert.equal(true, _fs.exist(`${outputRoot}/gulpfile.js`));
            assert.equal(true, _fs.exist(`${outputRoot}/gulpfile_sprite.js`));
            assert.equal(true, _fs.exist(`${outputRoot}/spec.doc.md`));

            done();
        });
    });


});