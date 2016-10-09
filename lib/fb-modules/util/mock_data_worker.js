/**
 * mock_data worker 根据规则生成mock数据
 * @author hzyuyanan(hzyuyanan@corp.netease.com)
 * @author abnerzheng(hzzhenglu@corp.netease.com)
 */
'use strict';

(function () {
    var vm = null;
    
    function getConstraintsFunction(constraints) {
      return constraints.map(function (item) {
        return 'var ' + item.name + '=function(){' + item.function.replace(/'/g, /\\'/) + '};';
      });
    }
    
    function getParamsNeedGen(params) {
      var ret = [];
      params.forEach(function(item) {
        if (!item.defaultValue && item.genExpression) {
          ret.push(item);
        }
      });
      return ret;
    }
    
    function mockWorkerFunc1() { //浏览器端
      var mockWorker = {
        getMockData: function (constraints, params, dataTypeList, callback, errorback) {
          params = getParamsNeedGen(params);
          if (!params.length) {
            return;
          }
          constraints = getConstraintsFunction(constraints);
          var blob, blobUrl, worker;
          if (!params instanceof Array) {
            params = [params];
          }
          var createOnMessage = function (params) {
            var onmessage = 'var onmessage=function(event){var data=JSON.parse(event.data),params=data[0],ds=data[2],result={};console.log(params);';
            params.forEach(function (param, index) {
              onmessage+='result[\''+param.name+'\']='+param.genExpression.replace(/\((.*)\)/g, function(){
                  return '.apply(this,['+(arguments[1]?arguments[1]+',':'')+'params['+index+'],ds])';
                })+';';
            });
            onmessage+='postMessage(JSON.stringify(result));};';
            return onmessage;
          };
          var s = constraints.concat([createOnMessage(params)]);
          blob = new Blob(s);
          blobUrl = window.URL.createObjectURL(blob);
          worker = new Worker(blobUrl);
          worker.onmessage = function (event) {
            var data = JSON.parse(event.data);
            callback(data);
          };
          worker.onerror = function (event) {
            errorback(event);
          };
          var p = JSON.stringify([params, dataTypeList]);
          worker.postMessage(p);
        }
      };
      return mockWorker;
    }
    
    /**
     * node端, 使用vm以及沙盒
     * @returns {{getMockData: mockWorker.getMockData}}
     */
    function mockWorkerFunc2() { //node端
      if (typeof(module) !== 'undefined') {
        vm = require('vm');
      }
      var mockWorker = {
        getMockData: function (constraints, params, dataTypeList, callback) {
          params = getParamsNeedGen(params);
          if (!params.length) {
            return;
          }
          constraints = getConstraintsFunction(constraints);
          var sandbox = {result: {}}; // result占位符, 保存结果
          constraints.forEach(function (constraint) {
            try {
              vm.runInNewContext(constraint, sandbox);// 向沙盒导入约束函数
            } catch (e) {
              // catch 到错误,这里直接退出
              // todo 可以一个一个constraint加入到沙盒中
              console.error("约束函数有错:");
              console.error(e.name, e.message);
              process.exit(-1); //直接退出
            }
          })
          
          var createGenFunc = function (param) {
            return "result['" + param.name + "']=" + param.genExpression.replace(/\((\w+)\)/g,function(){
                return '.apply(this,['+(arguments[1]?arguments[1]+',':'')+'data[0],data[1])';
              });
          };
          
          params.forEach(function (param) {
            try {
              vm.runInContext(createGenFunc(param), sandbox);
            } catch (e) {
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
    
  }
)();
