'use strict';
let assert = require('assert');
let _path = require('../../lib/util/path');
let _fs = require('../../lib/util/file');
let main = require('../../main');

describe('nei/main', function () {

    describe('main method', function () {
        this.timeout(40000);

        const PID = 11029;

        it('main `loadData` -> case 1', function (done) {
            main.loadData(PID, function () {
                done();
            }, function () {
                done();
            });
        });

    });

});
