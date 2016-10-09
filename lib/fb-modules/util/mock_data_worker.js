/**
 * mock_data worker 根据规则生成mock数据
 * @author hzyuyanan(hzyuyanan@corp.netease.com)
 * @author abnerzheng(hzzhenglu@corp.netease.com)
 */
'use strict';

var vm = require('vm'),
    NEI = require('./mock_data');

function getConstraintsFunction(constraints) {
  var re = [];
  constraints.forEach(function (item) {
    if(item.type !== 1) { //1为系统类型，这里需要过滤出系统内置类型，只返回用户定义的规则函数
      // 在函数体直接调用系统预置的方法, 在最前面追加两个参数, 值都为 null
      var funcBody = item.function.replace(/'/g, /\\'/).replace(/NEI\.(id|str|chinese|email|url|num|bool|var|repeat)\(([^\(\))]*)\)/g, function($0, $1, $2){
        return 'NEI.' + $1 + '(null, null' + ($2 ? ',' + $2 : '') + ')';
      });
      re.push('var ' + item.name + '=function(){' + funcBody + '};');
    }
  });
  return re;
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
/**
 * node端, 使用vm以及沙盒
 * @returns {{getMockData: mockWorker.getMockData}}
 */
function mockWorkerFunc2() { //node端
 var mockWorker = {
    getMockData: function (constraints, params, dataTypeList, callback) {
      params = getParamsNeedGen(params);
      if (!params.length) {
        return;
      }
      constraints = getConstraintsFunction(constraints);
      // result: 占位符, 保存结果
      // NEI: 系统自带辅助函数
      var sandbox = {result: {},NEI,dataTypeList};
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
            return '.apply(this,[param, dataTypeList, '+(arguments[1]?arguments[1]+',':'')+'])';
          });
      };
      
      params.forEach(function (param) {
        try {
          sandbox.param = param;
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

module.exports = mockWorkerFunc2();
