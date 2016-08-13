'use strict';
var assert = require('assert');
var should = require('should');
var u = require('../../main').util;

describe('util', function() {
    describe('validate', function() {
        it('should validate the input and return the judgement flag and outputdata', function() {
            let input = {name: 'xx', sex: 1, desc: 'xxxxx'};

            let rule = {name: {required: true}, sex: {required:true, value: /^\d$/}, desc: {}};
            let ret = u.validate(input, rule);
            ret.data.should.be.eql({name: 'xx', sex: 1, desc: 'xxxxx'});
            ret.success.should.be.eql(true);
            ret.fields.should.be.eql([]);

            let rule2 = {name: {required: true}, sex: {required:true, value: /^\d{2}$/}, desc: {}};
            let ret2 = u.validate(input, rule2);
            ret2.data.should.be.eql({});
            ret2.success.should.be.eql(false);
            ret2.fields.should.be.eql(['sex']);

            let rule3 = {name: {required: true}, sex: {required:true, value: /^\d$/}};
            let ret3 = u.validate(input, rule3);
            ret3.data.should.be.eql({name: 'xx', sex: 1});
            ret3.success.should.be.eql(true);
            ret3.fields.should.be.eql([]);

            let rule4 = {name: {required: true, value: /^\d$/}, sex: {required:true, value: /^\d{2}$/}, desc: {}};
            let ret4 = u.validate(input, rule4);
            ret4.data.should.be.eql({});
            ret4.success.should.be.eql(false);
            ret4.fields.should.be.eql(['name', 'sex']);
        });
    });
});
