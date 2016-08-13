'use strict';
let assert = require('assert');
let allDataTypes = require('./mock_datatypes.js').result;
let mockData = require('../../util/mock_data.js');

describe('Datatype mock service', function () {

    describe('工具函数测试', function () {
        it('取随机字符串的函数 getStr', function (done) {
            var result = mockData.getStr();
            assert.equal(true, typeof(result) === 'string');
            assert.equal(true, /^[a-z0-9]+$/i.test(result));
            assert.equal(true, result.length === 10);
            result = mockData.getStr(100);
            assert.equal(true, typeof(result) === 'string');
            assert.equal(true, /^[a-z0-9]+$/i.test(result));
            assert.equal(true, result.length === 100);
            var result = mockData.getStr(9, 6);
            assert.equal(true, typeof(result) === 'string');
            assert.equal(true, /^[a-z0-9]+$/i.test(result));
            assert.equal(true, result.length >=6 && result.length <= 9);
            done();
        });

        it('取随机数字的函数 getNum', function (done) {
            var result = mockData.getNum();
            assert.equal(true, typeof(result) === 'number');
            assert.equal(true, /^[0-9]+$/i.test(result));
            assert.equal(true, result <= 100000);
            result = mockData.getNum(10);
            assert.equal(true, typeof(result) === 'number');
            assert.equal(true, /^[0-9]+$/i.test(result));
            assert.equal(true, result <= 10);
            result = mockData.getNum(100, 20);
            assert.equal(true, typeof(result) === 'number');
            assert.equal(true, /^[0-9]+$/i.test(result));
            assert.equal(true, result >= 20 && result <= 100);
            done();
        });

        it('取随机布尔值的函数 getBool', function (done) {
            var result = mockData.getBool();
            assert.equal(true, typeof(result) === 'boolean');
            done();
        });

        it('取可变类型值的函数 getVar', function (done) {
            var result = mockData.getVar();
            assert.equal(true, typeof(result) === 'boolean' || typeof(result) === 'string' || typeof(result) === 'number');
            done();
        });
    });

    describe('数据测试', function () {
        const FILE_DATATYPE_ID = 14464;
        const BOOL_DATATYPE_ID = 14465;
        const NUMBER_DATATYPE_ID = 14466;
        const STRING_DATATYPE_ID = 14463;
        const ENUM_DATATYPE_ID = 14468;
        const ARRAY_DATATYPE_ID = 14467;
        const HASH1_DATATYPE_ID = 14469;
        const TREE_HASH_DATATYPE_ID = 14469;
        const ARRAY_TREE_DATATYPE_ID = 14470;

        it('文件类型 - 没有数据', function (done) {
            var dataTypeId = FILE_DATATYPE_ID;
            var dataType = allDataTypes.find(function (item) {
                return item.id === dataTypeId;
            });
            var result = mockData.get(dataTypeId, allDataTypes);
            assert.equal(true, result === null);
            done();
        });

        it('布尔类型', function (done) {
            var dataTypeId = BOOL_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            assert.equal(true, typeof(result) === 'boolean');
            done();
        });

        it('数值类型', function (done) {
            var dataTypeId = NUMBER_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            assert.equal(true, typeof(result) === 'number');
            done();
        });

        it('字符类型', function (done) {
            var dataTypeId = STRING_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            //console.log(result)
            assert.equal(true, typeof(result) === 'string');
            assert.equal(true, /^[a-z0-9]+$/i.test(result));
            done();
        });

        it('枚举类型 - 随机取一项', function (done) {
            // 枚举类型只可能是数值或者字符串
            var dataTypeId = ENUM_DATATYPE_ID;
            var dataType = allDataTypes.find(function (item) {
                return item.id === dataTypeId;
            });
            var params = [];
            dataType.params.forEach(function (param) {
                params.push(mockData.getSysDatatype({
                    id: param.type,
                    defaultValue: param.defaultValue
                }));
            });
            var result = mockData.get(dataTypeId, allDataTypes);
            // 值须为枚举中的某一项
            assert.equal(true, params.indexOf(result) > -1);
            done();
        });

        it('数组类型', function (done) {
            // 数组类型, 按照数据元素类型返回, 长度为 3
            var dataTypeId = ARRAY_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            assert.equal(true, result.length === 3);
            done();
        });

        it('哈希类型', function (done) {
            // 普通哈希类型
            var dataTypeId = HASH1_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            assert.equal(true, typeof(result) === 'object');
            done();
        });

        it('树型结构', function (done) {
            // 哈希类型, 有环
            var dataTypeId = TREE_HASH_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            console.log(result)
            assert.equal(true, typeof(result) === 'object');
            done();
        });

        it('数组 - 每一项是树型结构', function (done) {
            // 数组元素是哈希类型, 并且有环
            var dataTypeId = ARRAY_TREE_DATATYPE_ID;
            var result = mockData.get(dataTypeId, allDataTypes);
            //console.log(result)
            assert.equal(true, typeof(result) === 'object');
            done();
        });

        //it('test', function (done) {
        //    // 数组元素是哈希类型, 并且有环
        //    var params = require('./mock_interface.js').result.params.outputs;
        //    var allDataTypes = require('./mock_all.js').result;
        //    var result = mockData.getByParams(params, allDataTypes);
        //    console.log(result)
        //    assert.equal(true, typeof(result) === 'object');
        //    done();
        //});

    });
});

