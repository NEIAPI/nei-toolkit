'use strict';
/**
 * Created by abnerzheng on 2016/11/24.
 */

let EventEmitter = require('events');
let logger = require('../util/logger');

class JavaWebGenerator extends EventEmitter{
  constructor(options, logger) {
    super();
    
  }
  
  /**
   * 是否需要生成Java Web工程代码
   * @returns {boolean}
   */
  shouldGenerate(){
    return true;
  }
  
  
  
  /**
   * 生成聚类的key值
   * @param {Object} inter
   * @returns {Object}
   * @private
   * @example
   *      new JavaWebGenerator().clusterFunc({className: ""})// =>  -1
   *      new JavaWebGenerator().clusterFunc({className: "Just#test"})// => {className: "Just", methodName: "test"}
   *      new JavaWebGenerator().clusterFunc({className: "Just#test/heeh#actualMethod"})// => {className: "Just", methodName: "actualMethod"}
   */
  clusterFunc(inter){
    let className =  inter.className;
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
   *      new JavaWebGenerator()._tokenizeClassName('')// => []
   *      new JavaWebGenerator()._tokenizeClassName('JustForTest.test/test#test!test') // => ["JustForTest","test","test","test","test"]
   *      new JavaWebGenerator()._tokenizeClassName('JustForTest测试')// => ["JustForTest"]
   *      new JavaWebGenerator()._tokenizeClassName('测试jssdd')// => ["jssdd"]
   *      new JavaWebGenerator()._tokenizeClassName('测试代码')// => []
   */
  _tokenizeClassName(className){
    if(className == ''){
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
  _funcHeadGenerator(inter){
    return "";
  }
  
  
  
  
}


module.exports = JavaWebGenerator;
