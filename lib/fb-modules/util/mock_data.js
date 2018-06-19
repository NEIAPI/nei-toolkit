/**
 * mock 数据服务
 * @author baoym
 */
(function () {
  var ALPHA_NUMERIC_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var ALPHA_LOWER_CASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
  // 500个常见汉字
  var NORMAL_CHINESE_CHARS = '一二三十木禾上下土个八入大天人火文六七儿九无口日中了子门月不开四五目耳头米见白田电也长山出飞马鸟云公车牛羊小少巾牙尺毛卜又心风力手水广升足走方半巴业本平书自已东西回片皮生里果几用鱼今正雨两瓜衣来年左右万百丁齐冬说友话春朋高你绿们花红草爷亲节的岁行古处声知多忙洗真认父扫母爸写全完关家看笑着兴画会妈合奶放午收女气太早去亮和李语秀千香听远唱定连向以更后意主总先起干明赶净同专工才级队蚂蚁前房空网诗黄林闭童立是我朵叶美机她过他时送让吗往吧得虫很河借姐呢呀哪谁凉怕量跟最园脸因阳为光可法石找办许别那到都吓叫再做象点像照沙海桥军竹苗井面乡忘想念王这从进边道贝男原爱虾跑吹乐地老快师短淡对热冷情拉活把种给吃练学习非苦常问伴间共伙汽分要没孩位选北湖南秋江只帮星请雪就球跳玩桃树刚兰座各带坐急名发成动晚新有么在变什条宜实色华谷金尽层丰壮波浪灯作字苹丽劳尤其区巨它安块站已甲豆识纷经如好娃洼于首枝枫记刘胡戏棋钢观弹琴养休伸甜歌院除息您牵困员青宁室样校切教响班欠元包钟叹哈迟闹及身仔细次外计怦礼加夕与川州台争民族亿洁欢祖旗帜庆曲央交市旁优阴坛城国图申匹互京泪洋拥抱相扬讲打指接惊故侯奇寸落补拔功助取所信沿拾际蛙错答还言每';
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
  };

  var mockData = {
    _evalExp: function (genExp, param, ds) {
      try {
        // 生成规则直接使用Mock对象使用 Mock.js 的代码不替换
        if (!genExp.trim().startsWith('Mock')) {
          genExp = genExp.replace(/\((.*)\)/g, function (match, p1) {
            return '.call({param, ds}' + (p1 ? ',' + p1 : '') + ')';
          });
        }
        return eval(genExp);
      } catch (e) {
        var errorOne = this.errorData.find(function (err) {
          return err.name === param.name;
        });
        if (!errorOne) {
          this.errorData.push({name: param.name, message: e.message});
        }
      }
    },
    /**
     * 获取随机字符串
     * @param {Number} [len] - 字符串长度, 如果有 min, 则是最大长度
     * @param {Number} [min] - 字符串最小长度
     * @param {String} [dataTypeName] - 类型名称
     * @param {String} [chars] - 字符串源, 默认为 ALPHA_NUMERIC_CHARS
     */
    _getStr: function (len, min, dataTypeName, chars) {
      // 疑是 id 字段
      if (utils.isLikeId(dataTypeName)) {
        return String(utils.getId());
      }
      // 对疑是 xxx time 或者 xxx date 的字段, 返回当前时间之前一个月内的随机时间
      if (utils.isLikeTime(dataTypeName) || utils.isLikeDate(dataTypeName)) {
        return String(Date.now() - this._getNum(2592000));
      }
      // 疑是 email 字段
      if (utils.isLikeEmail(dataTypeName)) {
        return this._getStr(9, 6) + '@' + this._getStr(5) + '.' + this._getStr(3, null, null, ALPHA_LOWER_CASE_CHARS);
      }
      // 疑是 url 字段
      if (utils.isLikeUrl(dataTypeName)) {
        return 'http://' + this._getStr(3, null, null, ALPHA_LOWER_CASE_CHARS) + '.' + this._getStr(5, 15, null, ALPHA_LOWER_CASE_CHARS) + '.' + this._getStr(2, 8, null, ALPHA_LOWER_CASE_CHARS);
      }
      len = len || 10;
      if (min != undefined) {
        len = this._getNum(len, min);
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
    _getNum: function (range, min, dataTypeName) {
      // 疑是 id 字段
      if (utils.isLikeId(dataTypeName)) {
        return utils.getId();
      }
      // 疑是 xxx time/date 字段, 返回当前时间之前一个月内的随机时间
      if (utils.isLikeTime(dataTypeName) || utils.isLikeDate(dataTypeName)) {
        return Date.now() - this._getNum(2592000);
      }
      // range 为 undefined 或者 null
      range = range == undefined ? 100000 : range;
      min = min == undefined ? 0 : min;
      return Math.floor(Math.random() * (range - min + 1) + min);
    },
    /**
     * 获取随机布尔值
     */
    _getBool: function () {
      return Math.random() >= 0.5;
    },
    /**
     * 当为可变类型时，随机返回一种类型
     */
    _getVar: function () {
      var ran = Math.floor(Math.random() * 3);
      if (ran == 0) {
        return this._getStr();
      }
      if (ran == 1) {
        return this._getNum();
      }
      if (ran == 2) {
        return this._getBool();
      }
    },
    /**
     * 获取系统类型的 mock 数据, 优先取默认值
     * @param {Object} dataType - 数据模型
     * @property {Number} dataType.id - 数据模型id
     * @property {String} dataType.defaultValue - 数据模型默认值
     * @property {String} dataType.name - 数据模型名称
     */
    _getMockOfSysDatatype: function (dataType) {
      // 优先考虑 defaultValue, 其次考虑 genExpression
      if (!dataType.defaultValue && dataType.genExpression) {
        return this._evalExp(dataType.genExpression, dataType, this.ds);
      }
      // todo: 后端返回的格式有点乱, 有时字符有时数字, 这里先统一转成字符
      switch (dataType.id.toString()) {
        case '10001':
          // 字符串类型
          return dataType.defaultValue || this._getStr(null, null, dataType.name);
        case '10002':
          // 数值类型
          var num = parseFloat(dataType.defaultValue);
          return isNaN(num) ? this._getNum(null, 0, dataType.name) : num;
        case '10003':
          // 布尔类型
          var dv = dataType.defaultValue;
          return dv ? !/(^false|0)$/i.test(dv.toLowerCase()) : this._getBool();
        case '10000':
          // 可变类型
          return this._getVar();
        case '9999':
          // 文件类型
          return null;
        default:
          return null;
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
      this.errorData = [];
      var result = this._getMockOfDatatypeId(id);
      return {
        json: result,
        error: this.errorData
      };
    },
    /**
     * params 按 position 排序
     * @param {Array} params - 参数数组
     */
    _sortParams: function (params) {
      var ds = this.ds;
      (function sortParams(params) {
        params.forEach(function (param) {
          // 计算导入的参数顺序，具体说明可以参考 datatype_cache 中的 _$getParamsByPosition 方法
          if (param.datatypeId) {
            var dt = ds.find(function (dt) {
              return dt.id === param.datatypeId;
            });
            var importedDatatypeParams = dt.params.concat();
            sortParams(importedDatatypeParams);
            importedDatatypeParams.forEach(function (p, idx) {
              if (p.id === param.id) {
                param.position += idx;
              }
            });
          }
          if (param.params) {
            sortParams(param.params);
          }
        });
        params.sort(function (a, b) {
          return a.position - b.position;
        });
      })(params);
    },
    /**
     * 按类别和参数数组获取 mock 数据
     * @param {Number} format - 数据模型的类型
     * @param {Array} params - 参数数组
     * @param {Array} ds - 数据模型的数据源, 包括所有数据模型
     */
    getParams: function (format, params, ds) {
      this.ds = ds;
      this.errorData = [];
      this._sortParams(params);
      var result = this._getMockByParams(format, params);
      return {
        json: result,
        error: this.errorData
      };
    },
    /**
     * 获取某个数据模型的mock数据
     * @param {Number} id - 数据模型的id
     * @param {String} name - 字段名称
     * @param {Array} [traversePath] - 遍历路径
     */
    _getMockOfDatatypeId: function (id, name, traversePath) {
      traversePath = traversePath || [];
      var datatype = this.ds.find(function (dt) {
        return dt.id === id;
      });
      if (!datatype) {
        return '数据模型不存在';
      }
      var loopName = this._checkLoop(id, traversePath);
      if (loopName) {
        return loopName;
      }
      if (datatype.id === 10000) {
        // 可变类型
        return this._getVar();
      }
      return this._getMockByParams(datatype.format, datatype.params, name, traversePath);
    },
    /**
     * 按类别和参数数组获取 mock 数据
     * @param {Number} format - 数据模型的类型
     * @param {Array} params - 参数数组
     * @param {String} [name] - 参数字段名
     * @param {Array} [traversePath] - 遍历路径
     */
    _getMockByParams: function (format, params, name, traversePath) {
      this._sortParams(params);
      traversePath = traversePath || [];
      switch (format) {
        case 0: // 哈希
          var result = {};
          var pathNodeNum = null;
          params.forEach(function (param) {
            pathNodeNum = traversePath.length;
            if (!param.ignored) {//如果有忽略则不显示范例
              result[param.name] = this._getMockByParam(param, traversePath);
            }
            traversePath.length = pathNodeNum;
          }, this);
          return result;
        case 1: // 枚举
          return this._getEnumMock(params);
        case 2: // 数组
          // params[0] 存的是数组元素的类型
          return this._getArrayMockByArrEleType(params[0], 3, traversePath);
        case 3: // 字符
        case 4: // 数值
        case 5: // 布尔
          var sysDatatype = {
            id: format == 3 ? 10001 : format == 4 ? 10002 : 10003,
            name: name
          };
          if (params.length == 1) {
            // 自定义类型, 要考虑默认值和生成规则
            // 系统类型的 params 参数为空数组
            var param = params[0];
            sysDatatype = Object.assign(sysDatatype, {
              defaultValue: param.defaultValue,
              genExpression: param.genExpression
            });
          }
          return this._getMockOfSysDatatype(sysDatatype);
        case 6: // 文件
          return '<File>';
        default:
          break;
      }
    },
    /**
     * 获取某个参数(参数或者数据模型的属性)的 mock 值
     * @param {Object} param - 参数
     * @param {Array} traversePath - 遍历路径
     */
    _getMockByParam: function (param, traversePath) {
      if (param.isArray) {
        // 参数是数组类别
        return this._getArrayMockByArrEleType({
          defaultValue: param.defaultValue,
          genExpression: param.genExpression,
          type: param.type
        }, 3, traversePath);
      } else {
        var datatype = this.ds.find(function (dt) {
          return dt.id === param.type;
        });
        var getDefaultValue = function (param) {
          var dv = param.defaultValue;
          if (param.type <= 10003) {
            return dv;
          }
          // 哈希或者数组
          if (datatype.format === 0 || datatype.format === 2) {
            try {
              dv = JSON.parse(dv);
            } catch (e) {
              console.warn('默认值使用 JSON.parse 方法解析失败: ' + e);
              try {
                dv = eval('(' + dv + ')');
              } catch (e) {
                console.warn('默认值使用 eval 方法解析失败: ' + e);
              }
            }
          }
          return dv;
        };
        if (param.defaultValue) {
          // 有默认值, 优先考虑
          var params = [{
            type: datatype.id,
            defaultValue: getDefaultValue(param)
          }];
          // 如果是枚举类型, 则 type 为枚举元素的类型, 取第一个元素的类型
          if (datatype.format === 1) {
            params[0].type = datatype.params && datatype.params[0].type;
          }
          // 参数如果有默认值, 并且是哈希类型, 则将参数当作字符类型处理(否则就会产生循环调用)
          return this._getMockByParams(datatype.format === 0 ? 3 : datatype.format, params, datatype.name, traversePath);
        } else if (param.genExpression) {
          // 其次考虑生成规则
          param._isArray = datatype.format == 2;
          return this._evalExp(param.genExpression, param, this.ds);
        } else {
          // 否则就按正常的数据模型获取它的mock数据
          return this._getMockOfDatatypeId(param.type, param.name, traversePath);
        }
      }
    },
    /**
     * 枚举参数数组, 返回其中的一个随机值, 枚举值只能为 String 或者 Number
     * @param {Array} params - 参数数组
     */
    _getEnumMock: function (params) {
      var item = params[this._getNum(params.length - 1)];
      // 枚举类型可以没有属性
      if (!item) {
        return null;
      }
      var enumEleType = params && params[0].type;
      var enumEleDatatype = this.ds.find(function (dt) {
        return dt.id === enumEleType;
      });
      var enumEleSysType = null;
      if (enumEleDatatype.params.length) {
        // 自定义的字符或者数值类型
        // enumEleSysType = enumEleDatatype.params[0].type;
        // 根据 format 取值，这里有些老数据，params 的值没有正确设置
        if (enumEleDatatype.format === 4) {
          // 数值类型
          enumEleSysType = 10002;
        } else {
          // 其他都是字符串类型
          enumEleSysType = 10001;
        }
      } else {
        enumEleSysType = enumEleDatatype.id;
      }
      return this._getMockOfSysDatatype({
        id: enumEleSysType,
        defaultValue: item.defaultValue,
        genExpression: item.genExpression
      });
    },
    /**
     * 获取数组类型的 mock 数据
     * @param {Object} param - 数组元素
     * @param {Number} [repeatTime] - 生成的元素个数, 默认为3
     * @param {Array} [traversePath] - 遍历时存的路径
     * @return {Array}  - 数组 mock 数据
     */
    _getArrayMockByArrEleType: function (param, repeatTime, traversePath) {
      var result = null;
      if (param.defaultValue) {
        // 数组有默认值时, 求默认值
        result = '数组的默认值不能解析为数组: ' + param.defaultValue;
        try {
          var dv = eval(param.defaultValue);
          if (Array.isArray(dv)) {
            result = dv;
          }
        } catch (e) {
          // console.warn('数组的默认值不能解析为数组: ' + e);
        }
      } else if (param.genExpression) {
        result = this._evalExp(param.genExpression, {
          _isArray: 1,
          type: param.type,
          isArray: param.isArray
        }, this.ds);
        if (!Array.isArray(result)) {
          result = '生成规则的返回值不是数组: ' + JSON.stringify(result);
        }
      } else {
        // 默认生成三组数据
        repeatTime = isNaN(repeatTime) ? 3 : repeatTime <= 0 ? 3 : repeatTime;
        var genArr = function () {
          var arr = [];
          var pathNodeNum = null;
          for (var i = 0; i < repeatTime; i++) {
            pathNodeNum = traversePath.length;
            arr.push(this._getMockOfDatatypeId(param.type, param.name, traversePath));
            traversePath.length = pathNodeNum;
          }
          return arr;
        };
        if (param.isArray) {
          result = [];
          for (var i = 0; i < repeatTime; i++) {
            result.push(genArr.call(this));
          }
        } else {
          result = genArr.call(this);
        }
      }
      return result;
    },
    /**
     * 检测是否存在环
     * @param {Number} id - 要检测的id
     * @param {Array} traversePath - 遍历时存的路径
     * @return {String|undefined}  - 存在环时返回环的名称, 否则返回 undefined
     */
    _checkLoop: function (id, traversePath) {
      var datatype = this.ds.find(function (dt) {
        return dt.id == id;
      });
      if (datatype.format != 0 && datatype.format != 2 || datatype.id === 10000) {
        // 非哈希、非数组、可变类型时不会有循环依赖产生
        return;
      }
      var foundLoop = traversePath.find(function (item) {
        // todo: 这里不使用严格相等判断, 因为后端返回的数据类型有时是字符有时是数字
        return item.id == id;
      });
      if (foundLoop) {
        // 如果存在环, 就返回数据类型的名称
        // console.log(traversePath)
        // console.log(foundLoop.name)
        return '<' + foundLoop.name + '>';
      } else {
        traversePath.push({
          id: id,
          name: datatype.name
        });
      }
    }
  };

  /*
   * 公开可供用户调用的规则函数
   * */
  var publicRuleMethods = {
    ALPHA_NUMERIC_CHARS: ALPHA_NUMERIC_CHARS,
    ALPHA_LOWER_CASE_CHARS: ALPHA_LOWER_CASE_CHARS,
    NORMAL_CHINESE_CHARS: NORMAL_CHINESE_CHARS,

    /**
     * 获取id
     */
    id: utils.getId,
    /**
     * 获取随机字符串[私有]
     * @param {Number} [len] - 字符串长度, 默认为 10, 如果有 min, 则是最大长度
     * @param {Number} [min] - 字符串最小长度
     * @param {String} [chars] - 字符串源, 默认为 ALPHA_NUMERIC_CHARS
     */
    _str: function (len, min, chars) {
      len = len || 10;
      if (min != undefined) {
        len = publicRuleMethods._num(len, min);
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
     * 获取随机字符串
     * @param {Number} [len] - 字符串长度, 默认为 10, 如果有 min, 则是最大长度
     * @param {Number} [min] - 字符串最小长度
     * @param {String} [chars] - 字符串源, 默认为 ALPHA_NUMERIC_CHARS
     */
    str: function (len, min, chars) {
      return publicRuleMethods._str(len, min, chars);
    },
    /**
     * 获取随机中文字符串
     * @param {Number} [len] - 字符串长度, 默认为 10, 如果有 min, 则是最大长度
     * @param {Number} [min] - 字符串最小长度
     */
    chinese: function (len, min) {
      return publicRuleMethods._str(len, min, NORMAL_CHINESE_CHARS);
    },
    /**
     * 获取随机 email 地址
     */
    email: function () {
      return publicRuleMethods._str(9, 6) + '@' + publicRuleMethods._str(5) + '.' + publicRuleMethods._str(3, null, ALPHA_LOWER_CASE_CHARS);
    },
    /**
     * 获取随机 url 地址
     * @param {String} [protocol] - url 协议, 默认为 http
     */
    url: function (protocol) {
      protocol = protocol || 'http';
      return protocol + '://' + publicRuleMethods._str(3, null, ALPHA_LOWER_CASE_CHARS) + '.' + publicRuleMethods._str(5, 15, ALPHA_LOWER_CASE_CHARS) + '.' + publicRuleMethods._str(2, 8, ALPHA_LOWER_CASE_CHARS);
    },
    /**
     * 获取随机数字[私有]
     * @param {Number} [max] - 最大值, 默认为 10000
     * @param {Number} [min] - 最小值, 默认为 0
     */
    _num: function (max, min) {
      // max 为 undefined 或者 null
      max = max == undefined ? 100000 : max;
      min = min == undefined ? 0 : min;
      return Math.floor(Math.random() * (max - min + 1) + min);
    },
    /**
     * 获取随机数字
     * @param {Number} [max] - 最大值, 默认为 100000
     * @param {Number} [min] - 最小值, 默认为 0
     */
    num: function (max, min) {
      return publicRuleMethods._num(max, min);
    },
    /**
     * 获取随机布尔值
     */
    bool: function () {
      return Math.random() >= 0.5;
    },
    /**
     * 当为可变类型时，随机返回一种类型
     */
    var: function () {
      var ran = Math.floor(Math.random() * 3);
      if (ran == 0) {
        return publicRuleMethods.str.apply(this, arguments);
      }
      if (ran == 1) {
        return publicRuleMethods.num.apply(this, arguments);
      }
      if (ran == 2) {
        return publicRuleMethods.bool.apply(this, arguments);
      }
    },
    /**
     * 生成的数组元素个数
     * @param {Number} [num] - 数组元素个数, 默认是 3
     * @param {Function} [arrEleGenFunc] - 数组元素的生成函数
     * arrEleGenFunc 之后的参数统一会传给 arrEleGenFunc
     */
    repeat: function (num, arrEleGenFunc) {
      var param = this.param;
      var ds = this.ds;
      // _isArray 表示是数组
      if (param._isArray) {
        var arr = [];
        num = isNaN(num) ? 3 : num <= 0 ? 3 : num;
        if (typeof arrEleGenFunc == 'function') {
          // arrEleGenFunc 之后的参数
          var args = [].splice.call(arguments, 4);
          args.unshift(param, ds);
          for (var i = 0; i < num; i++) {
            arr.push(arrEleGenFunc.apply(this, args));
          }
          return arr;
        }
        var datatype = ds.find(function (dt) {
          return dt.id == param.type;
        });
        var genArr = function () {
          var _param;
          if (datatype.format == 0) {
            // 哈希
            _param = {
              type: param.type,
              name: datatype.name
            };
            return mockData._getArrayMockByArrEleType(_param, num, []);
          } else {
            var _isArray = datatype.format === 2;
            _param = {
              isArray: _isArray,
              type: datatype.params.length ? datatype.params[0].type : param.type,
              name: datatype.params.length ? datatype.params[0].typeName : param.name,
            };
          }
          return mockData._getArrayMockByArrEleType(_param, num, []);
        }.bind(this);
        if (param.isArray) {
          // isArray 表示数组的元素还是数组
          for (var i = 0; i < num; i++) {
            arr.push(genArr());
          }
        } else {
          arr = genArr();
        }
        return arr;
      } else {
        return '提示: NEI.repeat 方法只适用于数组元素';
      }
    },
    /**
     * 有循环引用时, 生成指定层数的 mock 数据
     * @param {Number} [num] - 指定的层数, 默认是 3
     * @param {Number} [arrRepeatNum] - 如果是数组, 则是数组的元素个数, 默认是 3
     */
    loop: function (num, arrRepeatNum) {
      var param = this.param;
      var ds = this.ds;
      num = isNaN(num) ? 3 : num <= 0 ? 3 : num;
      var datatype = ds.find(function (dt) {
        return dt.id === param.type;
      });
      if (!datatype.params || datatype.format !== 0) {
        return 'NEI.loop 方法只适用于有循环引用的情形';
      }
      var genMock = function () {
        var params = datatype.params;
        var loopParams = params.filter(function (p) {
          return p.type === param.type;
        });
        datatype.params = params.filter(function (p) {
          return p.type !== param.type;
        });
        var json = mockData._getMockOfDatatypeId(param.type, param.name);
        loopParams.forEach(function (p) {
          var pointer = json;
          var i = num - 1;
          while (i) {
            if (p.isArray) {
              pointer[p.name] = [];
              for (var j = 0; j< arrRepeatNum; j++) {
                var result = mockData._getMockOfDatatypeId(param.type, param.name);
                var pointer2 = result;
                // 减去2，不是1，要减去前面遍历的一层
                var k = num - 2;
                while (k) {
                  pointer2[p.name] = [mockData._getMockOfDatatypeId(param.type, param.name)];
                  pointer2 = pointer2[p.name][0];
                  k--;
                }
                pointer2[p.name] = null;
                pointer[p.name].push(result);
              }
            } else {
              pointer[p.name] = mockData._getMockOfDatatypeId(param.type, param.name);
            }
            pointer = pointer[p.name];
            i--;
          }
          // 最后一层置为 null
          pointer[p.name] = null;
        });
        // 还原 params, 不然第二次循环就丢失了 params
        datatype.params = params;
        return json;
      };
      var result = null;
      if (param._isArray) {
        arrRepeatNum = isNaN(arrRepeatNum) ? 3 : (arrRepeatNum <= 0 ? 3 : arrRepeatNum);
        result = [];
        for (var i = 0; i < arrRepeatNum; i++) {
          result.push(genMock());
        }
      } else {
        result = genMock();
      }
      return result;
    },
    /**
     * 特殊值 null
     */
    null: function () {
      return null;
    }
  };

  Object.assign(mockData, publicRuleMethods);

  // in Node.js vm or Web worker
  this.NEI = mockData;
})();
