/*
 * test boot file
 * @author  Auto build by NEI Builder
 */

'use strict';

let fs = require('fs');
let path = require('path');
let Mocha = require('mocha');
let mocha = new Mocha().ui('bdd').reporter('spec');
// dump test case
let dumpTestFile = (dir) => {
    fs.readdirSync(dir).forEach((name) => {
        let file = dir + name;
        if (name == 'cases') {
            return;
        }
        if (fs.lstatSync(file).isDirectory()) {
            dumpTestFile(file + '/');
        } else if (name == 'test.js') {
            mocha.addFile(file);
        }
    });
};
// run all test case
dumpTestFile(
    __dirname + ((process.argv[2] || '').trim() || '/')
);
mocha.run((failed) => {
    process.on('exit', () => {
        process.exit(failed);
    });
});