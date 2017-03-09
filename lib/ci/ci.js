/**
 * Created by abnerzheng on 2017/3/8.
 */
'use strict'

let EventEmitter = require('events');


class Ci extends EventEmitter {
  constructor(data){
    super();
    this.data = data;
  }
  
  verify(){
    
  }
  
  filterLoginTest(){
    
  }
  
  __updateCookie(){
  }
  
  run(){
    console.log(this.data);
  }
}

module.exports = Ci;