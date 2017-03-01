<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="/res/index.css">
    <script src="/src/vue.min.js"></script>
    <script src="/src/vue-resource.js"></script>
</head>
<body v-cloak>
    <div class="g-top">
                   <div class="m-head">
                       <div class="head"></div>
                   </div>
               </div>
               <div class="g-head">
                   <div class="m-banner" id="slide">
                       <ul class="imglist" v-bind:class="{ml:activeIndex}">
                           <li v-bind:class="{'active':index === activeIndex}" v-bind:style="{backgroundImage:'url('+item.src+')',backgroundPosition:'top center'}" v-for="(item,index) in imglist" ></li>
                       </ul>
                       <div class="ctr">
                           <span v-on:click="goto(index)" v-bind:class="{'active':index === activeIndex}" v-for="(item,index) in imglist" ></span>
                       </div>
                   </div>
               </div>
               <div class="g-boby" id="aclist">
                   <div class="wrap-tag">
                       <div class="m-tag" v-bind:class="{'m-tag-fixed':isFixed}">
                           <ul id="tag" class="taglist">
                               <li v-bind:class="{active:item.isActive}" v-on:click="checktab(item)" v-for="item in taglist">{{item.text}}</li>
                           </ul>
                       </div>
                   </div>
                   <div class="m-aclist">
                       <div class="wrap" id="H">
                           <p class="actitle">所谓流量就是王道！小编特选取了阅读量超1000的最热文章，谁是你心中最应该加鸡腿的网红文章？投出你神圣的鸡腿喂食他们吧！</p>
                           <ul  class="aclist">
                               <li v-for="ac in aclistH">
                                   <a class="alink">
                                       <div class="pic-box">
                                           <img v-bind:src="ac.picUrl" alt="">
                                           <div class="title"><em v-bind:title="ac.title">{{ac.title}}</em></div>
                                       </div>
                                   </a>
                                   <div class="adetail">
                                       <p><span>{{ac.circle}}</span>|<span>{{ac.author}}</span></p>
                                       <p>得票数：{{ac.praise}}</p>
                                       <a v-on:click="award(ac)" class="u-active-btn" v-bind:class="{'u-active-btn-disable':ac.isVote}">赏个鸡腿</a>
                                   </div>
                               </li>
                           </ul>
                       </div>
                       <div class="full-wrap" id="M">
                           <div class="wrap" >
                               <p class="actitle">有些文章男的看了会沉默，女的看了会流泪，发人深省，总让人不由自主地点赞评论，投出鸡腿喂食那些撩人的小文章吧～</p>
                               <ul class="aclist">
                                   <li v-for="ac in aclistM">
                                       <a class="alink" >
                                           <div class="pic-box">
                                               <img v-bind:src="ac.picUrl" alt="">
                                               <div class="title"><em v-bind:title="ac.title">{{ac.title}}</em></div>
                                           </div>
                                       </a>
                                       <div class="adetail">
                                           <p><span>{{ac.circle}}</span>|<span>{{ac.author}}</span></p>
                                           <p>得票数：{{ac.praise}}</p>
                                           <a v-on:click="award(ac)" class="u-active-btn" v-bind:class="{'u-active-btn-disable':ac.isVote}">赏个鸡腿</a>
                                       </div>
                                   </li>
                               </ul>
                           </div>
                       </div>
                       <div class="wrap" id="L">
                           <p class="actitle">这些文章质量奇高却少人问津，送给"沧桑遗珠"的他们一个鸡腿，表示诚挚的慰问与鼓励～</p>
                           <ul class="aclist">
                                <li v-for="ac in aclistL">
                                    <a class="alink">
                                        <div class="pic-box">
                                            <img v-bind:src="ac.picUrl" alt="">
                                            <div class="title"><em v-bind:title="ac.title">{{ac.title}}</em></div>
                                        </div>
                                    </a>
                                    <div class="adetail">
                                        <p><span>{{ac.circle}}</span>|<span>{{ac.author}}</span></p>
                                        <p>得票数：{{ac.praise}}</p>
                                        <a v-on:click="award(ac)" class="u-active-btn" v-bind:class="{'u-active-btn-disable':ac.isVote}">赏个鸡腿</a>
                                    </div>
                                </li>
                            </ul>
                       </div>
                   </div>
               </div>
<script src="/src/app.js"></script>
</body>
</html>