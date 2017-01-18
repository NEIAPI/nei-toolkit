var fs = require('fs');
var httpProxy = require('http-proxy');
var nei = require('./nei');

module.exports = function (req, res, options, headers) {
  options = options || {};
  if (typeof options === 'string') options = {target: options};
  
  if (options.onload) req.onload = options.onload;
  
  var server = httpProxy.createServer(function (req, res) {
     
  });
  var errorFunc = function () {
    return function (err, req, res) {
      // 处理代理错误信息
      if (err && err.code === 'ECONNRESET') return res.send('end');
      else {
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('代理请求错误，url为' + req.url);
      }
    }
  }
  server.on('error', errorFunc());
  server.on('proxyReq', function (proxyReq) {
    // 追加头信息
    proxyReq.setHeader('X-Special-Proxy-Header', 'JTR');
  });

  var headers = nei.getting().API_RES_HEADERS;
  Object.keys(headers).forEach(function (h) {
    res.header(h, headers[h]);
  });

  if (req.method == 'OPTIONS') {
    res.sendStatus(200);
    return
  }
  return server.web(req, res, options);
};
