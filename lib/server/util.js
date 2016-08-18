var exec = require('child_process').exec;
var os = require('os');
var qrcode = require('qrcode-npm');

var _ = module.exports = {
  /**
   * 扩展对象
   */
  extend: function(o1, o2, override) {
    if(!o2) return o1;
    for(var i in o2) {
      if(override === true || o1[i] === undefined) o1[i] = o2[i];
    }
    return o1;
  },
  /**
   * 判断是否是对象
   */
  isObject: function(obj) {
    return ({}).toString.call(obj).toLowerCase() === '[object object]';
  },
  /**
   * 判断是否是布尔值
   */
  isBoolean: function(obj) {
    return ({}).toString.call(obj).toLowerCase() === '[object boolean]';
  },
  /**
   * 打开浏览器
   */
  openBrowser: function(url, callback) {
    var opener;
    var map = {
      darwin: 'open',
      win32: 'start'
    };
    opener = map[process.platform] || 'xdg-open';
    return exec('' + opener + ' ' + url, callback);
  },
  /**
   * 补全路由中的代理url
   */
  resolveUrl: function(path, params) {
    params = params || {};
    return path.replace(/\{(\w*)?\}/g, function(all, name){
      return params[name];
    });
  },
  /**
   * 从reg2path的正则中获取参数
   */
  getParam: function(reg, path) {
    var ret = reg.exec(path);
    if(!ret) return false;

    var keys = reg.keys || [];
    var params = {};
    keys.forEach(function(key, index) {
      params[key.name] = ret[index + 1];
    });
    return params;
  },
  /**
   * 获取本地ip列表
   */
  getIPs: function() {
    var ifaces = os.networkInterfaces();
    var ips = [];
    for(var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if(details.family === 'IPv4' && details.address !== '127.0.0.1') {
          return ips.push(details.address)
        }
      });
    }
    return ips;
  },
  /**
   * 获取二维码
   */
  getQRCode: function(content, start){
    var qr;
    if(start == null) start = 2;
    try {
      qr = qrcode.qrcode(start, 'L');
      qr.addData(content || '');
      qr.make();
      return qr;
    } catch(err) {
      if(start > 8) {
        throw err;
      } else {
        return _.getQRCode(content, start + 2);
      }
    }
  },
  /**
   * 获取完整路径，针对express
   */
  getFullUrl: function(req){
    return req.protocol + '://' + req.get('host') + req.originalUrl;
  },
  /**
   * 比对两个query对象的关系
   */
  compareQuery: function(ruleQuery, reqQuery) {
    var keys = Object.keys(ruleQuery);
    var flag = true;
    for(var i=0,len=keys.length; i<len; i++) {
      var key = keys[i];
      if(!reqQuery.hasOwnProperty(key)) return false;

      var ruleVal = ruleQuery[key];
      var reqVal = reqQuery[key];
      if((ruleVal !== '' && ruleVal !== reqVal)) return false;
    }
    return flag;
  }
};
