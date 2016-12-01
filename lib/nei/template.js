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
require('./handlebars.util');

class Template{
  constructor(option,data){
    // this.overwrite =
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
   *    new Template()._overrideData({d:1}).data //=> {d:1}
   */
  _overrideData(newData){
    Object.assign(this.data, newData);
    return this;
  }
  
  /**
   * 输出文件
   * @private
   */
  _output(){
    let dirHandler = function (dir, result) {
      let cwd = path.join(result.outputPath, path.relative(this.path,dir));
      fileUtil.mkdir(cwd);
      return dir;
    }.bind(this);
    let fileHandler = function (file, result) {
      let fileName = path.join(result.outputPath, path.relative(this.path,file));
      try{
        fileName = Handlebars.compile(fileName)(this.data);
      }catch (e){
        logger.log('error', {message: `生成文件${pathName} 时出现错误: ${e}`});
      }
      
      if(fs.existsSync(fileName) && this.overwrite){
        logger.log("debug", {message:`${fileName} 已存在，将覆盖更新该文件`});
      }else if(fs.existsSync(fileName)){
        logger.log("debug", {message:`${fileName} 已存在，将保留该文件内容`});
        return file;
      }
      let fileContent = fileUtil.read(file).join('\n');
      try {
        fileContent = Handlebars.compile(fileContent)(this.data);
      }catch (e){
        logger.log('error', {message: `生成文件${fileName} 时出现错误: ${e}`});
      }
      fileUtil.mkdir(path.dirname(fileName));
      fileUtil.write(fileName, fileContent);
      return file;
    }.bind(this);
    if(!fs.existsSync(this.path)){
      logger.log('error', {message: `未能找到模板文件,请重新指定`});
      process.exit(-1);
    };
    
    //先写到一个tmp文件夹中，防止递归生成文件
    let tmpDir =path.join(os.tmpdir(), `./nei1480597677982/`);
    fileUtil.mkdir(tmpDir);
    fileUtil.walk(this.path, fileHandler, dirHandler, {outputPath: tmpDir});
    if(!this.output.endsWith('/'))
      this.output += '/';
    fileUtil.mkdir(this.output);
    fileUtil.cpdir(tmpDir, this.output, function (src, dst) {
      logger.log('debug', {message: `生成文件${dst}`});
    });
    fileUtil.rmdir(tmpDir);
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