/**
 * mock_data worker 根据规则生成mock数据
 * @author hzyuyanan(hzyuyanan@corp.netease.com)
 * @author abnerzheng(hzzhenglu@corp.netease.com)
 */
'use strict';

var vm = require('vm');
var fs = require("fs");
var mockjs = require("mockjs");

/**
 * 生成constraint函数方便注入
 * @param constraints
 * @returns {Array}
 */
function getConstraintsFunction(constraints) {
  var s = [];
  constraints.forEach(function (item) {
    if (item.type !== 1) { //1为系统类型，这里需要过滤出系统内置类型，只返回用户定义的规则函数
      // 在函数体直接调用系统预置的方法, 在最前面追加两个参数, 值都为 null
      var body = item.function.replace(/NEI\.(id|str|chinese|email|url|num|bool|var|repeat|loop)(\()/g,
        function ($0, $1) {
          var next = item.function[arguments[0].length];
          return 'NEI.' + $1 + '(param, ds' + (next == ')' ? '' : ',');
        });
      s.push('var ' + item.name + ' = function(){' + body + '};');
    }
  });
  return s;
}

var mockWorker = {
  getWorker: function (constraints) {
    var constraintFuncs = getConstraintsFunction(constraints);
    // result: 占位符, 保存结果
    // NEI: 系统自带辅助函数
    var sandbox = {result: null, Mock: mockjs, console: console}; //result为返回数据, Mock 导入Mockjs包
    sandbox = new vm.createContext(sandbox);
    
    constraintFuncs.forEach(function (constraintFunc) {
      try {
        vm.runInContext(constraintFunc, sandbox);// 向沙盒导入约束函数
      } catch (e) {
        // catch 到错误,这里直接退出
        // todo 可以一个一个constraint加入到沙盒中
        console.error("约束函数有错:");
        console.error(e.name, e.message);
        // process.exit(-1); //直接退出
      }
    });
    
    var mockData = fs.readFileSync(require.resolve("./mock_data"));
    
    vm.runInContext(mockData, sandbox);
    return sandbox;
  },
  getDataTypeMockData: function (constraints, id, ds) {
    var sandbox = this.getWorker(constraints); //获取注入constraint函数的运行沙盒
    sandbox.id = id;
    sandbox.ds = ds;
    const script = `result =  NEI.get(id,ds);`;
    vm.runInContext(script, sandbox);
    return {json: sandbox.result.json, error: sandbox.result.error}
  },
  getParameterMockData: function (constraints, format, params, ds) {
    var sandbox = this.getWorker(constraints); //获取注入constraint函数的运行沙盒
    sandbox.format = format;
    sandbox.params = params;
    sandbox.ds = ds;
    const script = `result =  NEI.getParams(format,params,ds);`;
    // const script = `result = hehe()`
    vm.runInNewContext(script, sandbox);
    
    return {json: sandbox.result.json, error: sandbox.result.error}
  },
  getAfterScriptResult: function (constraints, json, itf) {
    let result = {
      json: json,
      error: ''
    };
    // 没有 afterScript, 返回原始 mock 数据
    if (!itf.afterScript) {
      return result;
    }
    let sandbox = this.getWorker(constraints);
    // 按照 https://github.com/NEYouFan/nei-toolkit/blob/master/doc/NEI平台规则函数使用说明.md 注入参数
    sandbox.options = {
      host: itf.host,
      path: itf.path,
      method: itf.method,
      // 此处应是真实的响应头信息, mock 接口没有这样的信息
      headers: {},
      data: json
    };
    let afterScript = itf.afterScript.replace(/\(/g, function () {
      var next = itf.afterScript[arguments[1] + 1];
      return '(options' + (next == ')' ? '' : ',');
    });
    const script = `result = ${afterScript}`;
    try {
      vm.runInNewContext(script, sandbox);
      result.json = sandbox.result && sandbox.result.data;
    } catch (e) {
      result.error = [e.message];
    }
    return result;
  }
};

module.exports = mockWorker;
