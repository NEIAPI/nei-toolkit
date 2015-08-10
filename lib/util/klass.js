/*
 * Class Model
 * @module   klass
 * @author   genify(caijf@corp.netease.com)
 */
var _util = require('./util.js');
// find method in klass prototype chain
var _doFindIn = function(method,klass){
    while(!!klass){
        var key = null,
            pro = klass.prototype;
        // find method in current klass
        Object.keys(pro).some(function(name){
            if (method===pro[name]){
                key = name;
                return !0;
            }
        });
        // method finded in klass
        if (key!=null){
            return {
                name:key,
                klass:klass
            };
        }
        klass = klass.supor;
    }
};
// create Class constructor
// eg.
// var Parser = require('/path/to/klass.js').create();
// var pro = Parser.extend(require('/path/to/abstract.js'));
// pro.init = function(){
//      // call super init
//      this._super();
//      // do something
// };
exports.create = function(){
    // Class constructor
    var Klass = function(){
        this.init.apply(this,arguments);
    };
    Klass.prototype.init = function(){};
    // Class inherit api
    Klass.extend = function(supor) {
        if (!_util.isFunction(supor)) {
            return;
        }
        // do inherit
        this.supor = supor;
        var Parent = function(){};
        Parent.prototype = supor.prototype;
        this.prototype = new Parent();
        this.prototype.constructor = this;
        // for super method call
        var stack = [], phash = {};
        var _doUpdateCache = function (method, klass) {
            var ret = _doFindIn(method, klass);
            if (!ret) return;
            // save state
            if (stack[stack.length - 1] != ret.name) {
                stack.push(ret.name);
            }
            phash[ret.name] = ret.klass.supor;
            return ret.name;
        };
        // protected method for call super method
        this.prototype._super = function () {
            var name = stack[stack.length - 1],
                method = arguments.callee.caller;
            if (!name) {
                name = _doUpdateCache(method, this.constructor);
            } else {
                var parent = phash[name].prototype;
                // switch caller name
                if (!parent.hasOwnProperty(method) ||
                    method != parent[name]) {
                    name = _doUpdateCache(method, this.constructor);
                } else {
                    phash[name] = phash[name].supor;
                }
            }
            // call parent method
            var method = phash[name].prototype[name],
                result = method.apply(this, arguments);
            // exit super
            if (name===stack[stack.length-1]){
                stack.pop();
                delete phash[name];
            }
            return result;
        };
        return this.prototype;
    };
    return Klass;
};
