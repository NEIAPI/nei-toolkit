/**
 * Created by abnerzheng on 2016/12/1.
 */

'use strict';

let fileUtil  = require('../util/file');
let Handlebars = require('handlebars');
let fs = require('fs');
let path = require('path');
let logger = require('../util/logger');
let vm = require("vm");
let os = require("os");
const isTextOrBinary =  require('istextorbinary');
require('./handlebars.util');

class Template{
  constructor(option,data){
    this.data = {};
    this.overwriteData = data;
    this.output = option && option.output;
    this.path = option && option.path;
    this.overwrite = option && option.overwrite;
    this.handlebarsPath = option && option.handlebars;
    this.dataPath =  option && option.data;
  }

  /**
   *
   * @param {string} path
   * @return {*}
   * @private
   *
   * @example
   *     new Template()._loadData("") //=> {}
   *     new Template()._loadData("./template_test_data.json") //=> { "a": "test", "b": "this is a test", "c": [1,2,3,4] }
   *     new Template()._loadData("./a_file_not_exists.json")  //=>  {}
   *
   */
  _loadData(path){
    if(!path || !fs.existsSync(path)){
      return {};
    }
    let content = fileUtil.read(path);
    return JSON.parse(content.join(""));
  }

  /**
   * 导入handlebars函数
   * @param path
   * @return {*}
   * @private
   */
  _loadHandlebars(path){
    //todo 这里不使用沙盒，当用户导入的辅助函数有错误的时候直接报错
    if(!path || !fs.existsSync(path)){
      return this;
    }

    let sandbox = {Handlebars, console};
    let newVmContext = new vm.createContext(sandbox);
    var handlebarsCode = fs.readFileSync(path);
    try {
      let script = new vm.createScript(handlebarsCode);
      script.runInContext(newVmContext);//在vm中运行
    } catch (e) {
      logger.log('error', {message: `自定义文件${path} 包含错误: ${e}`});
    }
    return this; //链式调用，方便测试
  }

  /**
   * 使用命令行添加或覆盖数据
   * @param newData
   * @return {*}
   * @private
   * @example
   *    new Template()._overrideData({d:1}).data //=> {args:{d:1}}
   */
  _overrideData(newData){
    // 命令行输入的参数需要加到args这个域中
    newData = {args: newData};
    Object.assign(this.data, newData);
    return this;
  }

  /**
   * 输出文件
   * @private
   */
  _output(){
    if(!fs.existsSync(this.path)){
      logger.log('error', {message: `未能找到模板文件,请重新指定`});
      process.exit(-1);
    };

    let files = fileUtil.lsfile(this.path);
    files.forEach(file =>{
      let fileName = path.join(this.output, path.relative(this.path,file));
      const buffer = fs.readFileSync(file);
      let shouldCompile = true;

      if(!isTextOrBinary.isTextSync(fileName, buffer)){//如果测试为binary文件,就不解析content,当然文件名还是得解析的
          logger.log("debug", {message: `文件${fileName}为二进制文件，不解析文件内容,直接复制`});
          shouldCompile = false;
      }
      //解析文件名
      try {
        // 使用strict模式，会提示未定义field错误
        fileName = Handlebars.compile(fileName, {strict: true})(this.data);
      } catch (e) {
        logger.log('error', {message: `生成文件${fileName} 时出现错误: ${e}`});
        fileName = Handlebars.compile(fileName)(this.data); // 非严格模式下重新编译
      }
      let fileContent;
      if(shouldCompile) {
        if (fs.existsSync(fileName) && !this.overwrite) {
          logger.log("debug", {message: `${fileName} 已存在，将保留该文件内容`});
          return;
        }
        fileContent = fileUtil.read(file).join('\n');
        //解析文件内容
        try {
          fileContent = Handlebars.compile(fileContent, {strict: true})(this.data);
        } catch (e) {
          logger.log('error', {message: `生成文件${fileName} 时出现错误: ${e}`});
          fileContent = Handlebars.compile(fileContent)(this.data);
        }
      }else{
        fileContent = buffer;
      }
      fileUtil.mkdir(path.dirname(fileName));
      if(fs.existsSync(fileName) && this.overwrite){
        logger.log("debug", {message:`${fileName} 已存在，覆盖更新该文件`});
      }else {
        logger.log('debug',{message: `生成文件${fileName}`});

      }
      fileUtil.write(fileName, fileContent);
    });
  }
  /**
   * 公用方法，对外提供的唯一方法，执行命令，生成模板
   * @example
   *    new Template({output: '../testSpec/output',data:'../testSpec/data.json', path: '../testSpec/input', overwrite:true, handlebars: '../testSpec/handlebars.js'}).build(); //=> {}
   */
  build(){
    this.data = this._loadData(this.dataPath);
    this._overrideData(this.overwriteData);
    this._loadHandlebars(this.handlebarsPath);
    this._output();
  }
}

module.exports = Template;
