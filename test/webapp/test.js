'use strict';
let assert = require('assert');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let WebAppBuilder = require('../../lib/nei/webapp');
let testData = require('../test_data');

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
                outputRoot: outputRoot
            };
            let builder = new WebAppBuilder(config);
            builder.build(getTestDataCopy());

            assert.equal(true, _fs.exist(`${outputRoot}/deploy/release.${pid}.conf`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/JSON/nei-latest.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/puer.js`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/route.js`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/server.bat`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/server.sh`));
            assert.equal(true, _fs.exist(`${outputRoot}/nei.${pid}/util.js`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/mcss.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/bower.json`));
            assert.equal(true, _fs.exist(`${outputRoot}/src/main/webapp/.bowerrc`));

            done();
        });

    });
});

//var should = require('should'),
//    path = require('../../lib/util/path.js'),
//    WebApp = require('../../lib/nei/webapp.js'),
//    logger = require('../../lib/util/logger.js').logger;
//
//describe('nei/webapp',function(){
//
//    var log = function(type,event){
//        var args = event.data||[];
//        args.unshift(event.message||'');
//        logger[type].apply(logger,args);
//    };
//
//    describe('new WebApp',function(){
//
//        //it('should ok to build webapp',function(done){
//        //    this.timeout(40000);
//        //    var root = path.normalize(__dirname+'/');
//        //    (new WebApp({
//        //        id:10680,
//        //        overwrite:true,
//        //        proRoot:root+'../pro/',
//        //        debug:log.bind(log,'debug'),
//        //        info:log.bind(log,'info'),
//        //        warn:log.bind(log,'warn'),
//        //        error:log.bind(log,'error'),
//        //        done:function(){
//        //            done();
//        //        }
//        //    })).build();
//        //});
//
//        it('should ok to build webapp',function(done){
//            this.timeout(40000);
//            var root = path.normalize(__dirname+'/');
//            (new WebApp({
//                id:10680,
//                overwrite:true,
//                proRoot:root+'../pro/',
//                debug:log.bind(log,'debug'),
//                info:log.bind(log,'info'),
//                warn:log.bind(log,'warn'),
//                error:log.bind(log,'error'),
//                done:function(){
//                    done();
//                }
//            })).build();
//        });
//
//        //it('should ok to update webapp with id',function(done){
//        //    this.timeout(40000);
//        //    var root = path.normalize(__dirname+'/');
//        //    (new WebApp({
//        //        id:10680,
//        //        proRoot:root+'../pro/',
//        //        debug:log.bind(log,'debug'),
//        //        info:log.bind(log,'info'),
//        //        warn:log.bind(log,'warn'),
//        //        error:log.bind(log,'error'),
//        //        done:function(){
//        //            done();
//        //        }
//        //    })).update();
//        //});
//
//    });
//
//
//});