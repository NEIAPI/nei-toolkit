/**
 * mock 数据服务
 * @author baoym(hzbaoyongming@corp.netease.com)
 */
(function () {

    function mockFunc() {
        var ALPHA_NUMERIC_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var ALPHA_LOWER_CASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
        var START_ID = Math.floor(Math.random() * (100000 - 50000 + 1) + 50000);

        var utils = {
            // 疑是 id 字段
            isLikeId: function (name) {
                return name && (name.substr(-2).toLowerCase() === 'id' || name.substr(-3).toLowerCase() === 'ids');
            },
            // 疑是为 xxx time 字段
            isLikeTime: function (name) {
                return name && name.substr(-4).toLowerCase() === 'time';
            },
            // 疑是为 xxx date 字段
            isLikeDate: function (name) {
                return name && name.substr(-4).toLowerCase() === 'date';
            },
            // 疑是为 email 字段
            isLikeEmail: function (name) {
                return name && (name.substr(-5).toLowerCase() === 'email' || name.substr(-6).toLowerCase() === 'emails');
            },
            // 疑是为 url 字段
            isLikeUrl: function (name) {
                return name && (name.substr(-3).toLowerCase() === 'url' || name.substr(-4).toLowerCase() === 'urls');
            },
            getId: function () {
                START_ID += Math.floor(Math.random() * 1000);
                return START_ID;
            }
        }

        var mockData = {
            /**
             * 获取随机字符串
             * @param {Number} [len] - 字符串长度, 如果有 min, 则是最大长度
             * @param {Number} [min] - 字符串最小长度
             * @param {String} [dataTypeName] - 类型名称
             * @param {String} [chars] - 字符串源, 默认为 ALPHA_NUMERIC_CHARS
             */
            getStr: function (len, min, dataTypeName, chars) {
                // 疑是 id 字段
                if (utils.isLikeId(dataTypeName)) {
                    return String(utils.getId());
                }
                // 对疑是 xxx time 或者 xxx date 的字段, 返回当前时间之前一个月内的随机时间
                if (utils.isLikeTime(dataTypeName) || utils.isLikeDate(dataTypeName)) {
                    return String(Date.now() - this.getNum(2592000));
                }
                // 疑是 email 字段
                if (utils.isLikeEmail(dataTypeName)) {
                    return this.getStr(9, 6) + '@' + this.getStr(5) + '.' + this.getStr(3, null, null, ALPHA_LOWER_CASE_CHARS);
                }
                // 疑是 url 字段
                if (utils.isLikeUrl(dataTypeName)) {
                    return (this.getBool() ? 'http' : 'https') + '://' + this.getStr(3, null, null, ALPHA_LOWER_CASE_CHARS) + '.' + this.getStr(5, 15, null, ALPHA_LOWER_CASE_CHARS) + '.' + this.getStr(2, 8, null, ALPHA_LOWER_CASE_CHARS);
                }
                len = len || 10;
                if (min != undefined) {
                    len = this.getNum(len, min);
                }
                var i;
                var str = '';
                chars = chars || ALPHA_NUMERIC_CHARS;
                var charsCount = chars.length;
                for (i = 0; i < len; i++) {
                    str += chars[Math.floor(Math.random() * charsCount)];
                }
                return str;
            },
            /**
             * 获取随机数字
             * @param {Number} [range] - 数字限定范围
             * @param {Number} [min] - 最小值, 默认为 0
             * @param {String} [dataTypeName] - 类型名称
             */
            getNum: function (range, min, dataTypeName) {
                // 疑是 id 字段
                if (utils.isLikeId(dataTypeName)) {
                    return utils.getId();
                }
                // 疑是 xxx time/date 字段, 返回当前时间之前一个月内的随机时间
                if (utils.isLikeTime(dataTypeName) || utils.isLikeDate(dataTypeName)) {
                    return Date.now() - this.getNum(2592000);
                }
                // range 为 undefined 或者 null
                range = range == undefined ? 100000 : range;
                min = min == undefined ? 0 : min;
                return Math.floor(Math.random() * (range - min + 1) + min);
            },
            /**
             * 获取随机布尔值
             */
            getBool: function () {
                return Math.random() >= 0.5;
            },
            /**
             * 当为可变类型时，随机返回一种类型
             */
            getVar: function () {
                var ran = Math.floor(Math.random() * 3);
                if (ran == 0) return this.getStr();
                if (ran == 1) return this.getNum();
                if (ran == 2) return this.getBool();
            },
            /**
             * 获取系统类型的 mock 数据, 优先取默认值
             * @param {Object} dataType - 数据模型
             * @property {Number} dataType.id - 数据模型id
             * @property {String} dataType.defaultValue - 数据模型默认值
             * @property {String} dataType.name - 数据模型名称
             */
            getSysDatatype: function (dataType) {
                // todo: 后端返回的格式有点乱, 有时字符有时数字, 这里先统一转成字符
                switch (dataType.id.toString()) {
                    case '10001':
                        // 字符串类型
                        return dataType.defaultValue || this.getStr(null, null, dataType.name);
                    case '10002':
                        // 数值类型
                        var num = parseInt(dataType.defaultValue);
                        return isNaN(num) ? this.getNum(null, 0, dataType.name) : num;
                    case '10003':
                        // 布尔类型
                        var dv = dataType.defaultValue;
                        return dv ? dv.toLowerCase() !== 'false' : this.getBool();
                    case '10000':
                        // 可变类型
                        return this.getVar();
                    case '9999':
                        // 文件类型
                        return null;
                    default:
                        return null;
                }
            },
            /**
             * 根据参数数组, 返回 mock 值
             * @param {Array} params - 参数数组
             * @param {Array} traversePath - 遍历路径
             */
            getHashParams: function (params, traversePath) {
                var result = {};
                params.forEach(function (param) {
                    // 见 get() 方法中对"检测环"的注释说明
                    var pathNodeNum = traversePath.length; // 先记住结点个数
                    // todo: 后端返回数据类型没区分数字还是字符串
                    if (param.isArray.toString() === '1') {
                        // 获取三组数据
                        result[param.name] = [];
                        var v1 = this.getParam(param, traversePath);
                        result[param.name].push(v1);
                        traversePath.length = pathNodeNum; // 还原结点个数
                        var v2 = this.getParam(param, traversePath);
                        result[param.name].push(v2);
                        traversePath.length = pathNodeNum; // 还原结点个数
                        var v3 = this.getParam(param, traversePath);
                        result[param.name].push(v3);
                        traversePath.length = pathNodeNum; // 还原结点个数
                    } else {
                        result[param.name] = this.getParam(param, traversePath);
                        traversePath.length = pathNodeNum; // 还原结点个数
                    }
                }, this);
                return result;
            },
            /**
             * 枚举参数数组, 返回其中的一个随机值, 枚举值只能为 String 或者 Number
             * @param {Array} params - 参数数组
             */
            getEnumParams: function (params) {
                var item = params[this.getNum(params.length - 1)];
                // 枚举类型可以没有属性
                if (!item) {
                    return null;
                }
                return this.getSysDatatype({
                    id: item.type,
                    defaultValue: item.defaultValue,
                    name: item.name
                });
            },
            /**
             * 基本类型的参数: 布尔、数值、字符
             * @param {Object} param - 参数
             */
            getSysParam: function (param) {
                return this.getSysDatatype({
                    id: param.type,
                    defaultValue: param.defaultValue,
                    name: param.name
                });
            },
            /**
             * 获取某个数据模型的 mock 数据
             * @param {Number} id - 数据模型的 id
             * @param {String} defaultValue - 数据模型的默认值
             * @param {Array} traversePath - 遍历路径
             * @property {Number} traversePath.id - 路径结点id
             * @property {String} traversePath.name - 路径结点名称
             */
            getDataType: function (id, defaultValue, traversePath) {
                var dataType = this.ds.find(function (dt) {
                    return dt.id === id;
                });
                if (!dataType) {
                    return console.error('数据模型不存在');
                }
                switch (dataType.format) {
                    case 0:
                        if (id <= 10003) {
                            // 系统类型
                            return this.getSysDatatype(dataType);
                        } else {
                            // 哈希
                            // 先检测是否存在"环"
                            var foundLoop = traversePath.find(function (item) {
                                // todo: 这里不使用严格相等判断, 因为后端返回的数据类型有时是字符有时是数字
                                return item.id == id;
                            });
                            if (foundLoop) {
                                // 如果存在环, 就返回数据类型的名称
                                // console.log(traversePath)
                                // console.log(foundLoop.name)
                                //return {
                                //    __nei_loop: true,
                                //    __nei_datatype_name: foundLoop.name
                                //};
                                return '<' + foundLoop.name + '>';
                            }
                            traversePath.push({
                                id: id,
                                name: dataType.name
                            });
                            return this.getHashParams(dataType.params, traversePath);
                        }
                    case 1:
                        // 枚举, 需要考虑默认值的情况
                        if (defaultValue) {
                            // 枚举的所有类型应该都一样的, 这里取第一项的类型, 如果没有, 则默认为 String
                            return this.getSysDatatype({
                                id: dataType.params && dataType.params[0].type || 10001/*String*/,
                                defaultValue: defaultValue,
                                name: dataType.name
                            });
                        } else {
                            return this.getEnumParams(dataType.params);
                        }
                    case 2:
                        // 数组, 生成三组数据
                        var pathNodeNum = traversePath.length;
                        // 数组元素的类型从 params 中取
                        // todo: 添加数据模型, 后端返回的type是字符串
                        var arrElementType = parseInt(dataType.params[0].type);
                        var genArr = function () {
                            var dv = dataType.params[0] && dataType.params[0].defaultValue;
                            var v1 = this.getDataType(arrElementType, dv, traversePath);
                            traversePath.length = pathNodeNum;
                            pathNodeNum = traversePath.length;
                            var v2 = this.getDataType(arrElementType, dv, traversePath);
                            traversePath.length = pathNodeNum;
                            pathNodeNum = traversePath.length;
                            var v3 = this.getDataType(arrElementType, dv, traversePath);
                            return [v1, v2, v3];
                        }.bind(this);
                        if (dataType.params[0].isArray) {
                            // 多维数组
                            return [genArr(), genArr(), genArr()];
                        } else {
                            return genArr();
                        }
                    case 3:
                    case 4:
                    case 5:
                        // 自定义的字符, 数值, 布尔, 它们也会有默认值, 但要优先考虑使用该类型时所设置的默认值
                        // 系统类型的字符、数值、布尔, 没有默认值
                        var param = (dataType.params && dataType.params.length) ? dataType.params[0] : null;
                        return this.getSysParam({
                            name: dataType.name,
                            type: param ? param.type/*自定义类型*/ : dataType.id/*系统类型, 取它的id*/,
                            defaultValue: defaultValue || (param ? param.defaultValue : '')
                        });
                    case 6:
                        // 文件
                        return defaultValue || null;
                    default:
                        break
                }
            },
            /**
             * 获取某个参数(参数或者数据模型的属性)的 mock 值
             * @param {Object} param - 参数
             * @param {Array} traversePath - 遍历路径
             */
            getParam: function (param, traversePath) {
                param.type = parseInt(param.type);
                if (param.type <= 10003) {
                    // 系统类型
                    return this.getSysDatatype({
                        id: param.type,
                        defaultValue: param.defaultValue,
                        name: param.name
                    });
                } else {
                    return this.getDataType(param.type, param.defaultValue, traversePath);
                }
            },
            /**
             * 获取参数的 mock 数据
             * @param {Number} format - 参数类别
             * @param {Array} params - 参数数组
             * @param {Array} ds - 数据模型的数据源, 包括所有数据模型
             */
            getParams: function (format, params, ds) {
                this.ds = ds;
                // 获取某个非 hash 数据类型的默认值
                var getDatatypeDefaultValue = function (id) {
                    var dataType = this.ds.find(function (item) {
                        return item.id === id;
                    });
                    // 系统预定义的类型(String, Boolean, Number, File)没有 params 参数信息, 也没有默认值
                    return dataType.params[0] && dataType.params[0].defaultValue;
                }.bind(this);
                this.ds = ds;
                switch (format) {
                    case 0:
                        return this.getHashParams(params, []);
                    case 1:
                        return this.getEnumParams(params);
                    case 2:
                        // 数组, 生成三组数据
                        // 数组元素的类型从 params 中取
                        var arrElementType = params[0].type;
                        var genArr = function () {
                            var dv = getDatatypeDefaultValue(arrElementType);
                            var v1 = this.getDataType(arrElementType, dv, []);
                            var v2 = this.getDataType(arrElementType, dv, []);
                            var v3 = this.getDataType(arrElementType, dv, []);
                            return [v1, v2, v3];
                        }.bind(this);
                        if (params[0].isArray) {
                            // 多维数组
                            return [genArr(), genArr(), genArr()];
                        } else {
                            return genArr();
                        }
                    case 3:
                    case 4:
                    case 5:
                        // 自定义的字符, 数值, 布尔, 它们也会有默认值, 但要优先考虑使用该类型时所设置的默认值
                        var arrElementType = params[0].type;
                        var dv = params[0].defaultValue || getDatatypeDefaultValue(arrElementType);
                        return this.getDataType(arrElementType, dv, []);
                    case 6:
                        // 文件
                        return null;
                    default:
                        break
                }
            },
            /**
             * 获取某个数据模型的 mock 数据
             * @param {Number} id - 数据模型的 id
             * @param {Array} ds - 数据模型的数据源, 包括所有数据模型
             * 其他:
             * 环的检测: 在深度遍历的时候, 如果遍历的路径上第二次出现自定义的数据类型, 则说明存在环
             * 每次深度遍历完再进行广度遍历的时候(即遍历上一个结点的兄弟结点), 需要将上一次(同层级的)深度遍历时增加的结点去除
             * 这里使用一个小技巧, 把数组的长度更改为上一次(同层级的)深度遍历时的值就可以
             */
            get: function (id, ds) {
                this.ds = ds;
                return this.getDataType(id, null, []);
            }
        };

        return mockData;
    }

    if (typeof NEJ !== 'undefined') {
        NEJ.define(mockFunc);
    } else if (typeof(module) !== 'undefined') {
        module.exports = mockFunc();
    } else {
        return mockFunc();
    }
})();