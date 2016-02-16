/**
 * Created by huntbao on 16/2/16.
 */

'use strict';

let util = require('util');
let _io = require('../lib/util/io');

let api = util.format(
    (require('../package.json').nei || {}).api,
    11029
);

console.info(`load nei data from ${api}`);

_io.download(api, (data) => {
    let json = JSON.parse(data).result;
    let file = './test_data.json';
    let content = JSON.stringify(json, null, '\t');
    _io.outputSync(file, content);

    console.info(`file test_data.json is generated`);
});
