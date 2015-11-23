/*
 * Mobile Builder
 * @module   nei/mobile
 * @author   genify(caijf@corp.netease.com)
 */
var path  = require('path'),
    util  = require('util'),
    _util  = require('../util/util.js');
// template root
var TPL_ROOT = __dirname+'/mobile/template/';
// mobile build
var Mobile = module.exports
    = require('../util/klass.js').create();
var pro = Mobile.extend(require('./builder.js'));
/**
 * filter config field from input
 * @param  {Object} config - config data
 * @return {Object} result will be save to config file
 */
pro._filter = function(config){
    this._super(config);
    // TODO
};
/**
 * init template
 * @return {Void}
 */
pro._template = function(){
    this._super();
    this._parseTemplate(TPL_ROOT);
};
/**
 * format config data
 * @protected
 * @param  {Object} data - config data
 * @return {Void}
 */
pro._format = function(data){
    this._super(data);
    // TODO
};
/**
 * build project
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.webRoot - absolute path of web root
 * @param  {String}  config.viewRoot - absolute path of server template root
 * @param  {Object}  options - build options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._build = function(config,options,data){
    // TODO
};
/**
 * update project
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Number}  options.checkTime - last update check time
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._update = function(config,options,data){
    // TODO
};
/**
 * do something before build done
 * @param  {Object} config - nei config will be outputted
 * @return {Void}
 */
pro._beforeDone = function(config){
    // TODO
};
/**
 * export model
 * @param  {Object} config - config object
 * @param  {String} config.lang   - output language
 * @param  {String} config.author - author name
 * @param  {String} config.namePrefix  - Class Name Prefix
 * @param  {String} config.reqAbstract - Request Class Abstract Name
 * @return {Void}
 */
pro.model = function(config){
    // check language
    var func = {
        oc:this._modelOC,
        java:this._modelJava
    }[
        config.lang
    ];
    if (!func){
        this.emit('error',{
            data:[config.lang],
            message:'not supported language %s'
        });
        this.emit('done');
        return;
    }
    // save config
    var time = new Date();
    this._modConf = {
        prefix:config.namePrefix||'',
        base:config.reqAbstract||'',
        model:config.modelAbstract||'',
        rheader:config.reqHeaders||'',
        mheader:config.modelHeaders||'',
        author:config.author,
        year:time.getFullYear(),
        month:time.getMonth()+1,
        day:time.getDate()
    };
    // load config from nei
    this._loadConfig(func);
};
/**
 * generator Object-C model source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._exportModelOC = (function(){
    // map data type with Object C type
    var tmap = {
        10000:{typeName:'id',refName:'strong'},
        10001:{typeName:'NSString',refName:'copy'},
        10002:{typeName:'CGFloat',arrName:'NSNumber',refName:'assign',noStar:!0},
        10003:{typeName:'BOOL',arrName:'NSNumber',refName:'assign',noStar:!0}
    };
    // split data type by enum type and common type
    var splitDataType = function(){
        var ret = {
            enum:[],
            model:[]
        };
        Object.keys(this._types).forEach(
            function(id){
                var type = this._types[id];
                if (type.format==1){
                    var it = type.attrs[0]||{};
                    if (!isNaN(it.name)){
                        ret.enum.push(type);
                    }
                }else{
                    var isAbstr = !1;
                    type.attrs.forEach(function(it){
                        if (it.type==10000){
                            isAbstr = !0;
                        }
                    });
                    if (!isAbstr){
                        ret.model.push(id);
                    }
                }
            },this
        );
        return ret;
    };
    // format Object C property
    var formatProp = function(type){
        // check properties
        if (!type.props){
            type.props = [];
            type.klses = [];
            // format properties
            type.attrs.forEach(
                function(attr){
                    var conf = tmap[attr.type];
                    if (!conf){
                        var it = this._types[attr.type];
                        conf = {
                            refName:'strong',
                            typeName:this._modConf.prefix+it.name
                        }
                        // check enum type
                        if (it.format!=1){
                            type.klses.push(it.name);
                        }else{
                            conf.refName = 'assign';
                            conf.noStar = !0;
                        }
                        if (!type.hasEnum){
                            type.hasEnum = it.format==1;
                        }
                    }
                    var prop = _util.merge(conf,attr);
                    // check for Array
                    if (prop.isArray==1){
                        prop.noStar = !1;
                        prop.refName = 'strong',
                        prop.typeName = 'NSArray<'+(prop.arrName||prop.typeName)+' *>';
                    }
                    type.props.push(prop);
                },this
            );
        }
        return type;
    };
    return function(config,options,data){
        var root = config.proRoot+'Model/',
            conf = this._modConf||{};
        // split data type
        var ret = splitDataType.call(this);
        // build enum type
        ret.enum.forEach(function(it){
            it.pairs = [];
            it.attrs.forEach(function(attr){
                it.pairs.push({
                    key:'X'+_util.increment(),
                    value:attr.name,
                    desc:attr.description
                });
            });
        });
        if (ret.enum.length>0){
            var file = root+'Enum.h',
                content = this._mergeTemplate(
                    TPL_ROOT+'oc/enum.h',{
                        conf:conf,
                        enums:ret.enum
                    }
                );
            this._output(file,content);
        }
        // build data type model
        var arr = [];
        ret.model.forEach(
            function(id){
                // ignore system type
                if (!!tmap[id]){
                    return;
                }
                // check type
                var type = formatProp.call(
                        this,this._types[id]
                    ),
                    prefix = root+conf.prefix+type.name+'.';
                arr.push(type.name);
                // output xx.m and xx.h
                ['m','h'].forEach(
                    function(ext){
                        var file = prefix+ext,
                            content = this._mergeTemplate(
                                TPL_ROOT+'oc/model.'+ext,{
                                    conf:conf,
                                    type:type
                                }
                            );
                        this._output(file,content);
                    },this
                );
            },this
        );
        // output models.h
        arr.sort();
        var file = root+conf.prefix+conf.mheader+'.h',
            content = this._mergeTemplate(
                TPL_ROOT+'oc/models.h',{
                    conf:conf,
                    list:arr
                }
            );
        this._output(file,content);
    };
})();
/**
 * generator Object-C request source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._exportRequestOC = function(config,options,data){
    // TODO



};
/**
 * generator Object-C source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._modelOC = function(config,options,data){
    this._exportModelOC(config,options,data);
    this._exportRequestOC(config,options,data);
};
/**
 * generator Java source code
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
 * @param  {String}  config.proRoot - project root
 * @param  {Object}  options - update options
 * @param  {Boolean} options.overwrite - whether overwrite mode
 * @param  {Object}  data - data config from nei platform
 * @param  {Array}   data.pages - page object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.templates - template object list, eg. [{id,path,params,updateTime}]
 * @param  {Array}   data.interfaces - interface object list, eg. [{id,path,method,isRest,input,output}]
 * @return {Void}
 */
pro._modelJava = function(config,options,data){
    // TODO
};