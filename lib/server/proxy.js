'use strict';
let fs = require('fs');
let httpProxy = require('http-proxy');
let nei = require('./nei');

module.exports = function (req, res, options, headers) {
  options = options || {};
  if (typeof options === 'string') options = {target: options};

  options.changeOrigin = true;
  if (options.onload) req.onload = options.onload;

  let server = httpProxy.createServer(function (req, res) {

  });
  let errorFunc = function () {
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

  headers = nei.getting().API_RES_HEADERS;
  Object.keys(headers).forEach(function (h) {
    res.header(h, headers[h]);
  });

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return server.web(req, res, options);
};
