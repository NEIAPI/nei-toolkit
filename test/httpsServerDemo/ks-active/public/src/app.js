/**
 * Created by lhl on 2016/12/29.
 */


(function () {
    var DISTANCE = 140;
    var LARGEDISTANCE = DISTANCE + 1;
    var moz = /Gecko\//i.test(navigator.userAgent);
    var body = document[moz?'documentElement':'body'];
    var tagCom = new Vue({
        el:"#slide",
        data:{
            imglist:[{
                src:"/res/image/banner1.png",
                active:true
            },{
                src:"/res/image/banner2.png",
                active:false
            }],
            activeIndex:0
        },
        methods:{
            goto:function (index) {
                clearInterval(this._interval);
                this.activeIndex = index;
                this.start();
            },
            start:function () {
                var _this = this;
                this._interval = setInterval(function () {
                    _this.activeIndex = 1 - _this.activeIndex;
                },3000)
            }
        },
        created:function () {
            this.start();
        }

    });

    var cardCom = new Vue({
        el:"#aclist",
        components:{
            'ac-component':{
                template:"acComponent",
                props:['aclist']
            }
        },
        data:{
            taglist:[
                {id:"H",text:"Hot！年度流量王",isActive:true},
                {id:"M",text:"爆了！评论10000+",isActive:false},
                {id:"L",text:"冷门好文",isActive:false}
            ],
            isFixed:false,
            aclistH:[],
            aclistM:[],
            aclistL:[],
            active:"H"
        },
        methods:{
            award:function (item) {
                if(item.isPraise) return;
                this.$http.post("/annual/blog/vote?id="+item.id+"&type="+item.type).then(function (res) {
                    item.isPraise = !item.isPraise;
                    item.praise++;
                },function (res) {

                })
            },
            checktab:function (item) {
                if(item.isActive) return;
                this.taglist.forEach(function (tag) {
                    tag.isActive = false;
                });
                item.isActive = true;
                this.active = item.id;
                var offsetTop = document.getElementById(item.id).offsetTop;
                var currentTop = body.scrollTop;
                var targetTop = offsetTop - DISTANCE;

                // body.scrollTop = offsetTop - DISTANCE;
                 var isPlug = (targetTop > currentTop) ? true : false;

                var time = setInterval(function () {
                    if(currentTop == targetTop) {
                        clearInterval(time)
                    }
                    var _abs = Math.abs(currentTop-targetTop);
                    var _a = 500;
                    if(_abs < 500) {
                        _a = _abs;
                    }
                    if(currentTop > targetTop) {
                        currentTop = currentTop - _a;
                        body.scrollTop = currentTop;
                    } else {
                        currentTop = currentTop + _a;
                        body.scrollTop = currentTop;
                    }
                },100);


            }
        },
        create:function () {

        }
    });

    cardCom.$on("onsetstyle",function (style,index) {
        cardCom.isFixed = style;
        this.taglist.forEach(function (tag) {
            tag.isActive = false;
        });
        this.taglist[index].isActive = true;

    });

    Vue.http.get("/annual/blog/2016",{params:{limit:60}}).then(function (res) {
        var _aclist = res.body.blogList;
        var _aclistH = _aclist.slice(0,20);
        var _aclistM = _aclist.slice(20,40);
        var _aclistL = _aclist.slice(40);
            cardCom.aclistH = _aclistH;
            cardCom.aclistM = _aclistM;
            cardCom.aclistL = _aclistL;
    });

    window.onload = function () {


    window.onscroll = (function () {
        var etag = document.getElementById("tag");
        var top = etag.offsetTop;

        return function () {
            var fixed = false;
            var bodytop = body.scrollTop + LARGEDISTANCE;
            if(bodytop >= top){
                fixed = true;
            } else {
                fixed = false;
            }
            var domTopList = [
                document.getElementById("H").offsetTop,
                document.getElementById("M").offsetTop,
                document.getElementById("L").offsetTop
            ];
            var _temp = domTopList.concat(bodytop);
            _temp.sort(function (a,b) {
                return a >= b;
            });
            console.log(_temp);
            var index = _temp.indexOf(bodytop);
            index = index ? index - 1 : 0;
            cardCom.$emit("onsetstyle",fixed,index);
        }
    })();
    }

})();

