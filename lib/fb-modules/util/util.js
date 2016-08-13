/**
 * 前后端通用工具类
 * @author june_01(hzxiejin@corp.netease.com)
 */
(function() {

    var obj = {
        /**
         * 校验格式
         *
         * 传入数据，data为要校验数据，rules为规则表，其格式如下：
         *
         * {
         *     xxx字段名: {
         *         required: true,
         *         value: /\d{0,3}/
         *     }
         * }
         */
        validate: (function() {
            var rmap = {
                // 判断当前字段是否必须
                required: function(val, rval) {
                    return !rval || !!val || val === 0;
                },
                // 判断值是否符合正则
                value: function(val, rval) {
                    if(val === undefined) return true;
                    if(!(rval instanceof RegExp)) return false;

                    if(val instanceof Array) {
                        for(var i=0,len=val.length; i<len; i++) {
                            var item = val[i];
                            if(!rval.test(item)) return false;
                        }
                        return true;
                    }

                    return rval.test(val);
                },
                // 判断值是否是数字
                isNumber: function(val, rval) {
                    return !rval || typeof val === 'number';
                },
                // 判断值是否是数组
                isArray: function(val, rval) {
                    return !rval || val instanceof Array;
                },
                // 判断值是否是布尔值
                isBoolean: function(val, rval) {
                    return !rval || typeof val === 'boolean';
                }
            };
            return function(data, rules) {
                var flag = true;
                var failures = [];
                // 对数据中每个字段进行验证
                var ret = {};
                for(var key in data) {
                    if(data.hasOwnProperty(key)) {
                        var val = data[key];
                        var rule = rules[key];
                        if(rule) {
                            ret[key] = val;
                            // 对每个字段的逐条规则进行验证
                            for(var rkey in rule) {
                                if(rule.hasOwnProperty(rkey)) {
                                    var rval = rule[rkey];
                                    var vflag = rmap[rkey](val, rval);
                                    if(!vflag) {
                                        failures.push(key);
                                        flag = false;
                                    }
                                }
                            }
                        }
                    }
                }
                return {
                  data: flag ? ret : {}, // 返回根据传入的规则得出的数据，只收集规则对象中出现过的字段(无视传入数据有但是规则中没有的字段)，目前只有后端使用
                  success: flag, // 是否合法
                  fields: failures // 第一个检测到失败的名称
                };
            };
        })()
    };

    if(NEJ && NEJ.define) {
        NEJ.define([], function() {
            return obj;
        });
    } else if(module) {
        module.exports = obj;
    } else {
        return obj;
    }
})()
