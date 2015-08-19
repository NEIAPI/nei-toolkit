/*
 * Abstract NEI Builder
 * @module   nei/builder
 * @author   genify(caijf@corp.netease.com)
 */
var vm   = require('vm'),
    util = require('util'),
    swig = require('swig'),
   _io   = require('../util/io.js'),
   _fs   = require('../util/file.js'),
   _path = require('../util/path.js'),
   _util = require('../util/util.js');
// nei config file field
var NEI_CONFIG = {
    id:0,
    proRoot:'./',
    updateTime:0,
    template:'webapp'
};
// nei builder
// id         - nei project id
// proRoot    - absolute project root path
// updateTime - last update time
// overwrite  - whether overwrite file existed
var NEIBuilder = module.exports
    = require('../util/klass.js').create();
var pro = NEIBuilder.extend(require('../util/event.js'));
/**
 * class initialization
 * @param  {Object} config - config parameters
 * @return {Void}
 */
pro.init = function(config){
    this._super(config);
    // init template
    this._template();
    // init config
    config = config||{};
    this._config = _util.fetch(
        NEI_CONFIG, config
    );
    this._config = _util.merge(
        this._config,
        this._filter(config)
    );
    // init build/update config
    this._options = {
        overwrite:!!config.overwrite,
        checkTime:parseInt(config.updateTime,10)||0
    };
    // generator config root
    this._cnfRoot = util.format(
        '%snei.%s/',
        this._config.proRoot,
        this._config.id
    );
};
/**
 * load config from nei server
 * @private
 * @return {Void}
 */
pro._loadConfig = function(next){
    // load config data from nei platform
    var api = util.format(
        (require('../../package.json').nei||{}).api,
        this._config.id
    );
    this.emit('info',{
        data:[api],
        message:'load nei config from %s'
    });
    _io.download(api,this._parseConfig.bind(this,next));
};
/**
 * parse nei config object
 * @private
 * @param  {String} content - nei config string
 * @return {Void}
 */
pro._parseConfig = function(next,content){
    this.emit('info',{
        message:'parse nei config'
    });
    // parse content to json
    try{
        // timestamp    - current timestamp
        // pages        - [{id,path,name,parameters,updateTime}]
        // templates    - [{id,path,name,parameters,updateTime}]
        // interfaces   - [{id,path,method,isRest,input,output}]
        // datatypes    - [{id,name,format}]
        // attributes   - [{id,name,type,isArray}]
        var ret = JSON.parse(content);
    }catch(ex){
        this.emit('debug',{
            data:[content],
            message:'content from nei \n%s'
        });
        this.emit('error',{
            data:[ex.stack],
            message:'nei config parse error\n%s'
        });
    }
    // check config data
    if (!ret){
        return;
    }
    if (ret.code!==200){
        this.emit('error',{
            data:[ret],
            message:'illegal config data from nei %j'
        });
        return;
    }
    // check result
    var ret = ret.result;
    if (!ret.timestamp){
        this.emit('error',{
            data:[ret],
            message:'illegal config data from nei %j'
        });
        return;
    }
    // save update time
    this._config.updateTime = ret.timestamp;
    // build/update project
    this._data = this._format(ret)||ret;
    // do next process
    if (!!next){
        next.call(
            this,this._config,
            this._options,this._data
        );
        _io.onload(this._afterOutput.bind(this));
    }else{
        this._afterOutput();
    }
};
/**
 * parse template under dir
 * @protected
 * @param  {String} dir - template directory
 * @return {Void}
 */
pro._parseTemplate = function(dir){
    // init template cache
    if (!this._templates){
        this._templates = {};
    }
    // dump template
    _fs.lsfile(dir,
        function(name,file){
            this.emit('debug',{
                data:[file],
                message:'complie template %s'
            });
            this._templates[file] = swig.compileFile(file,{autoescape:!1});
        }
        .bind(this)
    );
};
/**
 * merge template with data
 * @protected
 * @param  {String} file - key of template
 * @param  {Object} data - template data
 * @return {String} content after merge data
 */
pro._mergeTemplate = function(file,data){
    file = _path.normalize(file);
    var func = (this._templates||{})[file];
    if (!!func){
        return func(data||{});
    }
    this.emit('warn',{
        data:[file],
        message:'template [%s] not exist'
    });
    return '';
};
/**
 * format config data
 * @protected
 * @param  {Object} data - config data
 * @return {Void}
 */
pro._format = function(data){
    // format data types
    this._types = {};
    (data.datatypes||[]).forEach(
        function(it){
            it.attrs = [];
            this._types[it.id] = it;
        },this
    );
    delete data.datatypes;
    // format type attributes
    (data.attributeList||[]).forEach(
        function(it){
            var type = this._types[it.parentId];
            if (!type){
                return;
            }
            type.attrs.push(it);
        },this
    );
    delete data.attributeList;
    // format data from nei
};
/**
 * generate mock data for data type
 * @protected
 * @param  {Object}  config - type config object
 * @param  {Number}  config.type        - data type id
 * @param  {Boolean} config.isArray     - is array mock
 * @param  {String}  config.description - type description
 * @param  {Object=} test - test for circular reference check
 * @return {Variable} mock data
 */
pro._genMockData = (function(){
    var str2json = function(code){
        if (!code){
            return;
        }
        try{
            // try json parse
            return JSON.parse(code);
        }catch(ex){
            try{
                // try eval
                var sandbox = {};
                vm.createContext(sandbox);
                vm.runInContext(util.format('ret = %s',code||''),sandbox);
                return sandbox.ret;
            }catch(e){
                // ignore
            }
        }
    };
    var fmap = {
        // Variable
        10000:function(config){
            var ret = str2json(config.description);
            if (ret!=null){
                return ret;
            }
            return this._genMockData({
                type:_util.randNext([10001,10002,10003])
            });
        },
        // String
        10001:function(){
            return _util.randString(
                _util.rand(5,20)
            );
        },
        // Number
        10002:function(){
            return _util.increment();
        },
        // Boolean
        10003:function(){
            return _util.randNext([!0,!1]);
        }
    };
    return function(config,test){
        var type = config.type,
            isArray = config.isArray===1;
        // for system type
        var ret,
            func = fmap[type];
        if (!!func){
            ret = func.call(this,config);
        }
        if (ret==null){
            var conf = this._types[type],
                attrs = conf.attrs||[];
            if (conf.format==1){
                // for enumeration type
                conf = _util.randNext(attrs)||{};
                ret = conf.name||'';
            }else{
                // for hash map
                ret = {};
                // for circular reference check
                if (!!test){
                    test[type] = !0;
                }
                attrs.forEach(function(it){
                    var dat = null;
                    // for circular reference check
                    test = test||{};
                    if (!test[it.type]){
                        dat = this._genMockData(it,test);
                    }else{
                        console.log('circular reference %s',it.type);
                    }
                    ret[it.name] = dat;
                },this);
            }
        }
        // generate array
        if (isArray){
            var ret = [ret];
            for(var i=_util.rand(5,10),it;i>=0;i--){
                it = _util.merge(config,{
                    isArray:0
                });
                ret.push(this._genMockData(it));
            }
        }
        return ret;
    };
})();
/**
 * output file content
 * @protected
 * @param  {String} file - file path
 * @param  {String} content - file content
 * @return {Void}
 */
pro._output = function(file,content){
    _io.output(file,content);
    this.emit('debug',{
        data:[file],
        message:'output %s'
    });
};
/**
 * after output done
 * @private
 * @return {Void}
 */
pro._afterOutput = function(){
    this._beforeDone(this._config);
    var file = _path.absolute(
        './nei.json',
        this._cnfRoot
    );
    this._config.proRoot = './';
    this.emit('debug',{
        data:[file],
        message:'output %s'
    });
    _fs.write(
        file,JSON.stringify(
            this._config,null,4
        )
    );
    this.emit('info',{
        message:'build success'
    });
    this.emit('done');
};
/**
 * filter config field from input
 * @protected
 * @param  {Object} config - config data
 * @return {Object} result will be save to config file
 */
pro._filter = function(config){
    // do something by subclass
};
/**
 * init template
 * @protected
 * @return {Void}
 */
pro._template = function(){
    // do something by subclass
};
/**
 * do something before build done
 * @protected
 * @param  {Object} config - nei config will be outputted
 * @return {Void}
 */
pro._beforeDone = function(config){
    // do something by subclass
};
/**
 * build project api
 * @return {Void}
 */
pro.build = function(){
    this._loadConfig(this._build);
};
/**
 * build project, implementation by subclass
 * @protected
 * @param  {Object}  config - config object, parameters return from this.config api
 * @param  {Number}  config.id - project id
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
    // do something by subclass
};
/**
 * update project api
 * @return {Void}
 */
pro.update = function(){
    this._loadConfig(this._update);
};
/**
 * update project, implementation by subclass
 * @protected
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
    // do something by subclass
};
/**
 * mock data api
 * @return {Void}
 */
pro.mock = function(){
    this._loadConfig(this._mock);
};
/**
 * update project mock data, implementation by subclass
 * @protected
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
pro._mock = function(config,options,data){
    // do something by subclass
};

