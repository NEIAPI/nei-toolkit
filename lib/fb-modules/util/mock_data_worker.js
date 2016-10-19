/**
 * mock_data worker 根据规则生成mock数据
 * @author hzyuyanan(hzyuyanan@corp.netease.com)
 * @author abnerzheng(hzzhenglu@corp.netease.com)
 */
'use strict';

var vm = require('vm');
var fs = require("fs");


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
            var body = item.function.replace(/'/g, /\\'/).replace(/NEI\.(id|str|chinese|email|url|num|bool|var|repeat|loop)\(([^\(\))]*)\)/g, function ($0, $1, $2) {
                return $1 + '(null, null' + ($2 ? ',' + $2 : '') + ')';
            });
            s.push('var ' + item.name + ' = function(){' + body + '};');
        }
    });
    return s;
}

function getParamsNeedGen(params) {
    var ret = [];
    params.forEach(function (item) {
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
        getWorker: function(constraints){
            var constraintFuncs = getConstraintsFunction(constraints);
            // result: 占位符, 保存结果
            // NEI: 系统自带辅助函数
            var sandbox = {result: null, module}; //result为返回数据
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
        getDataTypeMockData:function(constraints, id, ds){
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
            const script = `result =  NEI.getParams(format,params, ds);`;
          // const script = `result = hehe()`
            vm.runInNewContext(script, sandbox);
          
            return {json: sandbox.result.json, error: sandbox.result.error}
        }
    };
    return mockWorker;
}

module.exports = mockWorkerFunc2();
