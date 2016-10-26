/**
 * mock 数据服务
 * @author baoym(hzbaoyongming@corp.netease.com)
 */
(function () {

    var ALPHA_NUMERIC_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var ALPHA_LOWER_CASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
    // 来源: http://xh.5156edu.com/page/z6214m5618j18739.html
    var NORMAL_CHINESE_CHARS = '一乙二十丁厂七卜人入八九几儿了力乃刀又三于干亏士工土才寸下大丈与万上小口巾山千乞川亿个勺久凡及夕丸么广亡门义之尸弓己已子卫也女飞刃习叉马乡丰王井开夫天无元专云扎艺木五支厅不太犬区历尤友匹车巨牙屯比互切瓦止少日中冈贝内水见午牛手毛气升长仁什片仆化仇币仍仅斤爪反介父从今凶分乏公仓月氏勿欠风丹匀乌凤勾文六方火为斗忆订计户认心尺引丑巴孔队办以允予劝双书幻玉刊示末未击打巧正扑扒功扔去甘世古节本术可丙左厉右石布龙平灭轧东卡北占业旧帅归且旦目叶甲申叮电号田由史只央兄叼叫另叨叹四生失禾丘付仗代仙们仪白仔他斥瓜乎丛令用甩印乐句匆册犯外处冬鸟务包饥主市立闪兰半汁汇头汉宁穴它讨写让礼训必议讯记永司尼民出辽奶奴加召皮边发孕圣对台矛纠母幼丝式刑动扛寺吉扣考托老执巩圾扩扫地扬场耳共芒亚芝朽朴机权过臣再协西压厌在有百存而页匠夸夺灰达列死成夹轨邪划迈毕至此贞师尘尖劣光当早吐吓虫曲团同吊吃因吸吗屿帆岁回岂刚则肉网年朱先丢舌竹迁乔伟传乒乓休伍伏优伐延件任伤价份华仰仿伙伪自血向似后行舟全会杀合兆企众爷伞创肌朵杂危旬旨负各名多争色壮冲冰庄庆亦刘齐交次衣产决充妄闭问闯羊并关米灯州汗污江池汤忙兴宇守宅字安讲军许论农讽设访寻那迅尽导异孙阵阳收阶阴防奸如妇好她妈戏羽观欢买红纤级约纪驰巡寿弄麦形进戒吞远违运扶抚坛技坏扰拒找批扯址走抄坝贡攻赤折抓扮抢孝均抛投坟抗坑坊抖护壳志扭块声把报却劫芽花芹芬苍芳严芦劳克苏杆杠杜材村杏极李杨求更束豆两丽医辰励否还歼来连步坚旱盯呈时吴助县里呆园旷围呀吨足邮男困吵串员听吩吹呜吧吼别岗帐财针钉告我乱利秃秀私每兵估体何但伸作伯伶佣低你住位伴身皂佛近彻役返余希坐谷妥含邻岔肝肚肠龟免狂犹角删条卵岛迎饭饮系言冻状亩况床库疗应冷这序辛弃冶忘闲间闷判灶灿弟汪沙汽沃泛沟没沈沉怀忧快完宋宏牢究穷灾良证启评补初社识诉诊词译君灵即层尿尾迟局改张忌际陆阿陈阻附妙妖妨努忍劲鸡驱纯纱纳纲驳纵纷纸纹纺驴纽奉玩环武青责现表规抹拢拔拣担坦押抽拐拖拍者顶拆拥抵拘势抱垃拉拦拌幸招坡披拨择抬其取苦若茂苹苗英范直茄茎茅林枝杯柜析板松枪构杰述枕丧或画卧事刺枣雨卖矿码厕奔奇奋态欧垄妻轰顷转斩轮软到非叔肯齿些虎虏肾贤尚旺具果味昆国昌畅明易昂典固忠咐呼鸣咏呢岸岩帖罗帜岭凯败贩购图钓制知垂牧物乖刮秆和季委佳侍供使例版侄侦侧凭侨佩货依的迫质欣征往爬彼径所舍金命斧爸采受乳贪念贫肤肺肢肿胀朋股肥服胁周昏鱼兔狐忽狗备饰饱饲变京享店夜庙府底剂郊废净盲放刻育闸闹郑券卷单炒炊炕炎炉沫浅法泄河沾泪油泊沿泡注泻泳泥沸波泼泽治怖性怕怜怪学宝宗定宜审宙官空帘实试郎诗肩房诚衬衫视话诞询该详建肃录隶居届刷屈弦承孟孤陕降限妹姑姐姓始驾参艰线练组细驶织终驻驼绍经贯奏春帮珍玻毒型挂封持项垮挎城挠政赴赵挡挺括拴拾挑指垫挣挤拼挖按挥挪某甚革荐巷带草茧茶荒茫荡荣故胡南药标枯柄栋相查柏柳柱柿栏树要咸威歪研砖厘厚砌砍面耐耍牵残殃轻鸦皆背战点临览竖省削尝是盼眨哄显哑冒映星昨畏趴胃贵界虹虾蚁思蚂虽品咽骂哗咱响哈咬咳哪炭峡罚贱贴骨钞钟钢钥钩卸缸拜看矩怎牲选适秒香种秋科重复竿段便俩贷顺修保促侮俭俗俘信皇泉鬼侵追俊盾待律很须叙剑逃食盆胆胜胞胖脉勉狭狮独狡狱狠贸怨急饶蚀饺饼弯将奖哀亭亮度迹庭疮疯疫疤姿亲音帝施闻阀阁差养美姜叛送类迷前首逆总炼炸炮烂剃洁洪洒浇浊洞测洗活派洽染济洋洲浑浓津恒恢恰恼恨举觉宣室宫宪突穿窃客冠语扁袄祖神祝误诱说诵垦退既屋昼费陡眉孩除险院娃姥姨姻娇怒架贺盈勇怠柔垒绑绒结绕骄绘给络骆绝绞统耕耗艳泰珠班素蚕顽盏匪捞栽捕振载赶起盐捎捏埋捉捆捐损都哲逝捡换挽热恐壶挨耻耽恭莲莫荷获晋恶真框桂档桐株桥桃格校核样根索哥速逗栗配翅辱唇夏础破原套逐烈殊顾轿较顿毙致柴桌虑监紧党晒眠晓鸭晃晌晕蚊哨哭恩唤啊唉罢峰圆贼贿钱钳钻铁铃铅缺氧特牺造乘敌秤租积秧秩称秘透笔笑笋债借值倚倾倒倘俱倡候俯倍倦健臭射躬息徒徐舰舱般航途拿爹爱颂翁脆脂胸胳脏胶脑狸狼逢留皱饿恋桨浆衰高席准座脊症病疾疼疲效离唐资凉站剖竞部旁旅畜阅羞瓶拳粉料益兼烤烘烦烧烛烟递涛浙涝酒涉消浩海涂浴浮流润浪浸涨烫涌悟悄悔悦害宽家宵宴宾窄容宰案请朗诸读扇袜袖袍被祥课谁调冤谅谈谊剥恳展剧屑弱陵陶陷陪娱娘通能难预桑绢绣验继球理捧堵描域掩捷排掉堆推掀授教掏掠培接控探据掘职基著勒黄萌萝菌菜萄菊萍菠营械梦梢梅检梳梯桶救副票戚爽聋袭盛雪辅辆虚雀堂常匙晨睁眯眼悬野啦晚啄距跃略蛇累唱患唯崖崭崇圈铜铲银甜梨犁移笨笼笛符第敏做袋悠偿偶偷您售停偏假得衔盘船斜盒鸽悉欲彩领脚脖脸脱象够猜猪猎猫猛馅馆凑减毫麻痒痕廊康庸鹿盗章竟商族旋望率着盖粘粗粒断剪兽清添淋淹渠渐混渔淘液淡深婆梁渗情惜惭悼惧惕惊惨惯寇寄宿窑密谋谎祸谜逮敢屠弹随蛋隆隐婚婶颈绩绪续骑绳维绵绸绿琴斑替款堪搭塔越趁趋超提堤博揭喜插揪搜煮援裁搁搂搅握揉斯期欺联散惹葬葛董葡敬葱落朝辜葵棒棋植森椅椒棵棍棉棚棕惠惑逼厨厦硬确雁殖裂雄暂雅辈悲紫辉敞赏掌晴暑最量喷晶喇遇喊景践跌跑遗蛙蛛蜓喝喂喘喉幅帽赌赔黑铸铺链销锁锄锅锈锋锐短智毯鹅剩稍程稀税筐等筑策筛筒答筋筝傲傅牌堡集焦傍储奥街惩御循艇舒番释禽腊脾腔鲁猾猴然馋装蛮就痛童阔善羡普粪尊道曾焰港湖渣湿温渴滑湾渡游滋溉愤慌惰愧愉慨割寒富窜窝窗遍裕裤裙谢谣谦属屡强粥疏隔隙絮嫂登缎缓编骗缘瑞魂肆摄摸填搏塌鼓摆携搬摇搞塘摊蒜勤鹊蓝墓幕蓬蓄蒙蒸献禁楚想槐榆楼概赖酬感碍碑碎碰碗碌雷零雾雹输督龄鉴睛睡睬鄙愚暖盟歇暗照跨跳跪路跟遣蛾蜂嗓置罪罩错锡锣锤锦键锯矮辞稠愁筹签简毁舅鼠催傻像躲微愈遥腰腥腹腾腿触解酱痰廉新韵意粮数煎塑慈煤煌满漠源滤滥滔溪溜滚滨粱滩慎誉塞谨福群殿辟障嫌嫁叠缝缠静碧璃墙撇嘉摧截誓境摘摔聚蔽慕暮蔑模榴榜榨歌遭酷酿酸磁愿需弊裳颗嗽蜻蜡蝇蜘赚锹锻舞稳算箩管僚鼻魄貌膜膊膀鲜疑馒裹敲豪膏遮腐瘦辣竭端旗精歉熄熔漆漂漫滴演漏慢寨赛察蜜谱嫩翠熊凳骡缩慧撕撒趣趟撑播撞撤增聪鞋蕉蔬横槽樱橡飘醋醉震霉瞒题暴瞎影踢踏踩踪蝶蝴嘱墨镇靠稻黎稿稼箱箭篇僵躺僻德艘膝膛熟摩颜毅糊遵潜潮懂额慰劈操燕薯薪薄颠橘整融醒餐嘴蹄器赠默镜赞篮邀衡膨雕磨凝辨辩糖糕燃澡激懒壁避缴戴擦鞠藏霜霞瞧蹈螺穗繁辫赢糟糠燥臂翼骤鞭覆蹦镰翻鹰警攀蹲颤瓣爆疆壤耀躁嚼嚷籍魔灌蠢霸露囊罐';
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
        _evalExp: function (genExp, param, ds) {
            try {
                genExp = genExp.replace(/\(/g, function () {
                    var next = genExp[arguments[1] + 1];
                    return '(param,ds' + (next == ')' ? '' : ',');
                });
                return eval(genExp);
            } catch (e) {
                var errorOne = this.errorData.find(function (err) {
                    return err.name == param.name;
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
            if (ran == 0) return this._getStr();
            if (ran == 1) return this._getNum();
            if (ran == 2) return this._getBool();
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
                    var num = parseInt(dataType.defaultValue);
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
         * 按类别和参数数组获取 mock 数据
         * @param {Number} format - 数据模型的类型
         * @param {Array} params - 参数数组
         * @param {Array} ds - 数据模型的数据源, 包括所有数据模型
         */
        getParams: function (format, params, ds) {
            this.ds = ds;
            this.errorData = [];
            var result = this._getMockByParams(format, params);
            return {
                json: result,
                error: this.errorData
            };
        },
        /**
         * 获取某个数据模型的mock数据
         * @param {Number} id - 数据模型的id
         * @param {Array} [traversePath] - 遍历路径
         */
        _getMockOfDatatypeId: function (id, traversePath) {
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
            return this._getMockByParams(datatype.format, datatype.params, traversePath);
        },
        /**
         * 按类别和参数数组获取 mock 数据
         * @param {Number} format - 数据模型的类型
         * @param {Array} params - 参数数组
         * @param {Array} [traversePath] - 遍历路径
         */
        _getMockByParams: function (format, params, traversePath) {
            traversePath = traversePath || [];
            switch (format) {
                case 0: // 哈希
                    var result = {};
                    var pathNodeNum = null;
                    params.forEach(function (param) {
                        pathNodeNum = traversePath.length;
                        result[param.name] = this._getMockByParam(param, traversePath);
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
                        id: format == 3 ? 10001 : format == 4 ? 10002 : 10003
                    };
                    if (params.length == 1) {
                        // 自定义类型, 要考虑默认值和生成规则
                        // 系统类型的 params 参数为空数组
                        var param = params[0];
                        sysDatatype = Object.assign(sysDatatype, {
                            defaultValue: param.defaultValue,
                            genExpression: param.genExpression,
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
                if (param.defaultValue) {
                    // 有默认值, 优先考虑
                    var params = [{
                        type: datatype.id,
                        defaultValue: param.defaultValue
                    }];
                    // 参数如果有默认值, 并且是哈希类型, 则将参数当作字符类型处理(否则就会产生循环调用)
                    return this._getMockByParams(datatype.format === 0 ? 3 : datatype.format, params, traversePath);
                } else if (param.genExpression) {
                    // 其次考虑生成规则
                    param._isArray = datatype.format == 2;
                    return this._evalExp(param.genExpression, param, this.ds);
                } else {
                    // 否则就按正常的数据模型获取它的mock数据
                    return this._getMockOfDatatypeId(param.type, traversePath);
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
            return this._getMockOfSysDatatype({
                id: item.type,
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
                        arr.push(this._getMockOfDatatypeId(param.type, traversePath));
                        traversePath.length = pathNodeNum;
                    }
                    return arr;
                }
                if (param.isArray) {
                    result = [];
                    for (var i = 0; i < repeatTime; i++) {
                        result.push(genArr.call(this))
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
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         * @param {Number} [len] - 字符串长度, 默认为 10, 如果有 min, 则是最大长度
         * @param {Number} [min] - 字符串最小长度
         * @param {String} [chars] - 字符串源, 默认为 ALPHA_NUMERIC_CHARS
         */
        str: function (param, ds, len, min, chars) {
            return publicRuleMethods._str(len, min, chars);
        },
        /**
         * 获取随机中文字符串
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         * @param {Number} [len] - 字符串长度, 默认为 10, 如果有 min, 则是最大长度
         * @param {Number} [min] - 字符串最小长度
         */
        chinese: function (param, ds, len, min) {
            return publicRuleMethods._str(len, min, NORMAL_CHINESE_CHARS);
        },
        /**
         * 获取随机 email 地址
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         */
        email: function (param, ds) {
            return publicRuleMethods._str(9, 6) + '@' + publicRuleMethods._str(5) + '.' + publicRuleMethods._str(3, null, ALPHA_LOWER_CASE_CHARS);
        },
        /**
         * 获取随机 url 地址
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         * @param {String} [protocol] - url 协议, 默认为 http
         */
        url: function (param, ds, protocol) {
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
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         * @param {Number} [max] - 最大值, 默认为 100000
         * @param {Number} [min] - 最小值, 默认为 0
         */
        num: function (param, ds, max, min) {
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
            if (ran == 0) return publicRuleMethods.str.apply(this, arguments);
            if (ran == 1) return publicRuleMethods.num.apply(this, arguments);
            if (ran == 2) return publicRuleMethods.bool.apply(this, arguments);
        },
        /**
         * 生成的数组元素个数
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         * @param {Number} [num] - 数组元素个数, 默认是 3
         * @param {Function} [arrEleGenFunc] - 数组元素的生成函数
         * arrEleGenFunc 之后的参数统一会传给 arrEleGenFunc
         */
        repeat: function (param, ds, num, arrEleGenFunc) {
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
                        }
                        return mockData._getArrayMockByArrEleType(_param, num, []);
                    } else {
                        var _isArray = datatype.format === 2;
                        _param = {
                            isArray: _isArray,
                            type: datatype.params.length ? datatype.params[0].type : param.type,
                            name: datatype.params.length ? datatype.params[0].typeName : param.name,
                        }
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
                return '提示: NEI.repeat 方法只适用于数组元素'
            }
        },
        /**
         * 有循环引用时, 生成指定层数的 mock 数据
         * @param {Object} param - 参数对象
         * @param {Array} ds - 所有数据模型列表
         * @param {Number} [num] - 指定的层数, 默认是 3
         * @param {Number} [arrRepeatNum] - 如果是数组, 则是数组的元素个数, 默认是 3
         */
        loop: function (param, ds, num, arrRepeatNum) {
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
                var json = mockData._getMockOfDatatypeId(param.type);
                loopParams.forEach(function (p) {
                    var pointer = json;
                    var i = num - 1;
                    while (i) {
                        pointer[p.name] = mockData._getMockOfDatatypeId(param.type);
                        pointer = pointer[p.name];
                        i--;
                    }
                    // 最后一层置为 null
                    pointer[p.name] = null;
                });
                // 还原 params, 不然第二次循环就丢失了 params
                datatype.params = params;
                return json;
            }
            var result = null;
            if (param._isArray) {
                arrRepeatNum = isNaN(arrRepeatNum) ? 3 : arrRepeatNum <= 0 ? 3 : arrRepeatNum;
                result = [];
                for (var i = 0; i < arrRepeatNum; i++) {
                    result.push(genMock());
                }
            } else {
                result = genMock();
            }
            return result;
        }
    };

    Object.assign(mockData, publicRuleMethods);

    // in Node.js vm or Web worker
    this.NEI = mockData;
})();