/**
 * mock_data worker 根据规则生成mock数据
 * @author hzyuyanan(hzyuyanan@corp.netease.com)
 */
'use strict';

(function () {
    var vm = null;
    function getConstraintsFunction(constraints) {
        return constraints.map(function (item) {
            return 'var ' + item.name + '=function(){' + item.function.replace(/'/g, /\\'/) + '};';
        });
    }

    function getParamsNeedGen(params){
        return params.filter(e=>{return !e.defaultValue && e.genExpression})
    }

    function mockWorkerFunc1() { //浏览器端
        var mockWorker = {
            getMockData: function (constraints, params, dataTypeList, callback) {
                params = getParamsNeedGen(params);
                if(!params.length){
                    return;
                }
                constraints = getConstraintsFunction(constraints);

                var blob, blobUrl, worker, index = 0, length = params.length, result = {};
                if (!params instanceof Array) {
                    params = [params];
                }
                var createOnMessage = function (param) {
                    var onmessage = `
                        var onmessage=function(event){
                            var data = JSON.parse(event.data);
                            var result ={` + param.name + `:` + param.genExpression.replace(/\(\)/g, '.apply(this,data)') + '};' +
                        `postMessage(JSON.stringify(result));
                        };`;
                    return onmessage;
                };
                params.forEach(function (param) {
                    //todo 每个开一个线程是否会对性能有影响
                    var s = constraints.concat([createOnMessage(param)]);
                    blob = new Blob(s);
                    blobUrl = window.URL.createObjectURL(blob);
                    worker = new Worker(blobUrl);
                    worker.onmessage = function (event) {
                        var data = JSON.parse(event.data);
                        Object.assign(result, data);
                        index++;
                        if (index === length) {
                            callback(result);
                        }
                    };
                    worker.onerror = function (event) {
                        console.error(event.message);
                        index++;
                        if (index === length) {
                            callback(result);
                        }
                    };

                    var p = JSON.stringify([param, dataTypeList]);
                    worker.postMessage(p);
                });
            }
        };
        return mockWorker;
    }

    /**
     * node端, 使用vm以及沙盒
     * @returns {{getMockData: mockWorker.getMockData}}
     */
    function mockWorkerFunc2() { //node端
        if (typeof(module) !== 'undefined'){
            vm  = require('vm');
        }
        var mockWorker = {
            getMockData: function (constraints, params, dataTypeList, callback) {
                params = getParamsNeedGen(params);
                if(!params.length){
                    return;
                }
                constraints = getConstraintsFunction(constraints);
                let sandbox = {result: {}}; // result占位符, 保存结果
                constraints.forEach(function(constraint){
                    try{
                        vm.runInNewContext(constraint, sandbox);// 向沙盒导入约束函数
                    }catch (e){
                        // catch 到错误,这里直接退出
                        // todo 可以一个一个constraint加入到沙盒中
                        console.error("约束函数有错:");
                        console.error(e.name, e.message);
                        process.exit(-1); //直接退出
                    }
                })
    
                let createGenFunc = function(param){
                    return "result['" + param.name + "']=" + param.genExpression.replace(/\(\)/g, '.apply(this);');
                };
    
                params.forEach(function (param) {
                    try{
                        vm.runInContext(createGenFunc(param), sandbox);
                    }catch(e){
                        console.log("生成参数有错:");
                        console.log(e.name, e.message);
                    }
                });
                return sandbox.result;
            }
        };
        return mockWorker;
    }
    
    if (typeof NEJ !== 'undefined') {
        NEJ.define(mockWorkerFunc1);
    } else if (typeof(module) !== 'undefined') {
        module.exports = mockWorkerFunc2();
    } else {
        return mockWorkerFunc1();
    }
    
})();
