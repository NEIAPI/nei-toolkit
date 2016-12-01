'use strict';
/**
 * Created by abnerzheng on 2016/11/24.
 */

let EventEmitter = require('events');
let logger = require('../util/logger');
let _io = require('../util/io');
let _path = require('../util/path');
let dsUitl = require("./ds.util");

class JavaWebGenerator extends EventEmitter{
  constructor(options, logger) {
    super();
    
  }
  
  /**
   * 是否需要生成Java Web工程代码
   * @returns {boolean}
   */
  static shouldGenerate(){
    return true;
  }
  
  
  
  /**
   * 生成聚类的key值
   * @param {Object} inter
   * @returns {Object}
   * @private
   * @example
   *      JavaWebGenerator.clusterFunc({className: ""})// =>  -1
   *      JavaWebGenerator.clusterFunc({className: "Just#test"})// => {className: "Just", methodName: "test"}
   *      JavaWebGenerator.clusterFunc({className: "Just#test/heeh#actualMethod"})// => {className: "Just", methodName: "actualMethod"}
   */
  static clusterFunc(inter){
    let className =  dsUitl.getReqClassName(inter, true);
    let token = this._tokenizeClassName(className);
    switch (token.length){
      case undefined:
        logger.log();
        return -1;
        break;
      case 0:
        logger.log("error", {message: `[代码映射]: {[${className || "   "}]:[无效]},    [接口路径]: ${inter.path || "   "}`});
        return -1;
        break;
      case 1:
        logger.log("info", {message: `[代码映射]: ${className}  处于顶层，将生成独立的Controller文件`});
        break;
      case 2:
        //todo
        break;
      default:
        logger.log("info", {message: `[代码映射]: ${className},   [接口路径]：${inter.path}, 代码映射路径超过两级,将使用起始Token为类名称，未Token为方法名称`});
        break;
    }
    
    return {className: token[0], methodName: token[token.length-1]}
  }
  
  /**
   * 检验className是否符合生成规范
   * @param {string} className
   * @returns {boolean}
   * @private
   *
   * @example
   *      JavaWebGenerator._tokenizeClassName('')// => []
   *      JavaWebGenerator._tokenizeClassName('JustForTest.test/test#test!test') // => ["JustForTest","test","test","test","test"]
   *      JavaWebGenerator._tokenizeClassName('JustForTest测试')// => ["JustForTest"]
   *      JavaWebGenerator._tokenizeClassName('测试jssdd')// => ["jssdd"]
   *      JavaWebGenerator._tokenizeClassName('测试代码')// => []
   */
  static _tokenizeClassName(className){
    if(!className){
      return [];
    }
    return className.split(/\W+/g).filter(token=>{
      return token != "";
    });
  }
  
  
  /**
   * 从java controller代码中获取package定义文本
   * 根据Java规范(https://docs.oracle.com/javase/specs/jls/se8/html/jls-7.html#jls-7.4.1)
   * 其语法如下
   * PackageDeclaration:
   *      {PackageModifier} package Identifier {. Identifier} ;
   *      PackageModifier:
   *        Annotation
   *      Idetifiler
   *
   * @param inter
   * @returns {string}
   *    @example
   *          //
   *          // test
   *          // package com.netease.edu.enterprise.web.controller.json;
   *          // !test a
   *          // just a test
   *          // :: should return "com.netease.edu.enterprise.web.controller.json"
   *          JavaWebGenerator._getPackageDefine(
   *                '\r\n'    +
   *                'test \n '   +
   *                'package com.netease.edu.enterprise.web.controller.json;\r'  +
   *                '!test a\n' +
   *                'just a test') //=>  "com.netease.edu.enterprise.web.controller.json"
   *
   *          // packages com.netease_test.test;    :: package(s)! but not package
   *          // package  com.test;
   *          // package  this.one.shouldn't be take;    :: should get the first one rather the last one.
   *          //
   *          // import example;
   *          // : should return "com.netease_test.test"
   *          JavaWebGenerator._getPackageDefine(
   *                 'packages com.netease_test.test; \r\n'   +
   *                 'package  com.test;                \n'   +
   *                 'package  this.one.shouldn\'t be take; \n'+
   *                 '                                  \n'   +
   *                 'import example;'
   *                 ) //=> "com.test"
   *          JavaWebGenerator._getPackageDefine(
   *                 'packages com.netease_test.test; \r\n'   +
   *                 'import example;'
   *                 ) //=>  -1
   *
   *
   */
  static _getPackageDefine(controllerCode){
    let result = controllerCode.match(/package\s+([\w\.]+)[\n\r]*/);
    if(result == null){
      return -1;
    }
    return result[1];
  }
  
  
  
  
  /**
   * 生成函数头部
   * @param interface
   * @returns {string}
   * @private
   */
  static _funcHeadGenerator(inter){
    return "";
  }
  
  /**
   * todo 加上全局参数设置是否为Restful
   * 转换rest path
   * 因为nei目前(2016.11.30)只支持":"格式的语法，而java spring mvc支持的是"{}"语法，需要转换
   * @param {string}path
   * @return {string} converted path
   * @example
   *      JavaWebGenerator.restPathConverter("") //=> {path: "", isRestful: false, pathVariable:[]}
   *      JavaWebGenerator.restPathConverter("/api/:id/:pagenum") //=> { path: "/api/{id}/{pagenum}", isRestful: true, pathVariable:["id", "pagenum"]}
   *      JavaWebGenerator.restPathConverter("/api/test:id/") //=> {path: "/api/test{id}/", isRestful: true, pathVariable:["id"]}
   *      JavaWebGenerator.restPathConverter("/api/test/") //=> {path: "/api/test/", isRestful: false, pathVariable:[]}
   *
   */
  static restPathConverter(path){
    let isRestful = false;
    let pathVariable = [];
    path = path.replace(/:(\w+)/g, function(a,b) {
      isRestful = true;
      pathVariable.push(b);
      return "{" + b + "}";
    });
    return {
      isRestful,
      pathVariable,
      path
    }
  }
  
  static genFiles(ds, data,doc,dir, compileInVm){
    //todo 在Rest风格中，有可能存在base path放在整个controller的场景，这时候就需要这个字段
    // 目前先做不包含base path这种情景
    let actionToGene = {};
    
    //todo 排序，以沙盒实现导入, 总的有序以为着
    ds.forEach((inter) =>{//first phase for clustering
      let result = this.clusterFunc(inter);
      let pathConverted = this.restPathConverter(inter.path);
      inter = Object.assign(inter, pathConverted);
      if(actionToGene.hasOwnProperty(result.className)){
        inter.methodName = result.methodName;//todo 这里有side effect,需评估
        actionToGene[result.className].push(inter);
      }else {
        actionToGene[result.className] = [inter];
      }
    });
    
    //todo 这里直接修改了path,需要评估, 这些格式兼容应该提前做好
    
    
    
  
    for(let clazz in actionToGene){
      let vmData = Object.assign({}, data, {interfaces:{}, templates: {}});
      vmData.className =clazz;
      vmData.interfaces = actionToGene[clazz];
      let filename = compileInVm(doc.name, vmData);
      if (filename.trim() === '') {
        return logger.log('debug', {
          message: `文件 ${doc.name} 的计算值为空字符串, 不生成`
        });
      }
      let file = _path.normalize(`${dir}/${filename}`);
      let content = compileInVm(doc.content || '', vmData);
      _io.outputSync(file,content);
      logger.log('debug', {
        data: [file],
        message: '输出: %s'
      });
    }
  };
}


module.exports = JavaWebGenerator;
