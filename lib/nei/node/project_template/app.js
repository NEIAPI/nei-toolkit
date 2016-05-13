/*
 * app boot file
 * @author {{author}}
 * Auto build by NEI Builder
 */

'use strict';

let path = require('path');
let WebServer = require('node-webserver');

let argObject = {};
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('-')) {
        argObject[process.argv[i].replace(/-/g, '')] = process.argv[++i];
    } else {
        argObject[process.argv[i]] = true;
    }
}

const isOnline = argObject.m === 'online';
process.appConfig = isOnline ? require('./server/config/online.json') : require('./server/config/develop.json');

let server = new WebServer({
    port: process.env.PORT || 8080,
    controller: require('./server/controller.json'),
    filter: require('./server/filter.json'),
    serverRoot: __dirname,
    webRoot: path.join(__dirname, '/public'),
    viewPath: isOnline ? './template' : './view',
    viewEngine: 'ejs'
});

server.on('error', function (err) {
    console.log('error:' + err);
});

server.start();

