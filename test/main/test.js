'use strict';
let assert = require('assert');
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

        it('main `parseData` -> case 2', function (done) {
            let str = '{"result":{"timestamp":111}, "code":200}';
            let json = main.parseData(str);
            assert.equal(1, Object.keys(json).length);
            done();
        });

    });

});
