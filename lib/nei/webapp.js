/*
 * WebApp Builder
 * @module   nei/webapp
 * @author   genify(caijf@corp.netease.com)
 */
var path  = require('path'),
    util  = require('util'),
   _fs    = require('../util/file.js'),
   _path  = require('../util/path.js'),
   _util  = require('../util/util.js');
// template root
var TPL_ROOT = __dirname+'/webapp/template/';
var DPL_ROOT = _path.absolute('../../template/',__dirname+'/');
// method
var API_METHOD = ['POST','GET','PUT','DELETE','HEAD'];
// webapp project builder
// webRoot  - path of web root relative to project root
// viewRoot - path of server view template relative to project root
var WebApp = module.exports
    = require('../util/klass.js').create();
var pro = WebApp.extend(require('./builder.js'));
/**
 * filter config field from input
 * @param  {Object} config - config data
 * @return {Object} result will be save to config file
 */
pro._filter = function(config){
    return {
        webRoot:_path.absolute(
            config.webRoot||'./src/main/webapp/',
            config.proRoot
        ),
        viewRoot:_path.absolute(
            config.viewRoot||'./src/main/views/',
            config.proRoot
        )
    };
};
/**
 * init template
 * @return {Void}
 */
pro._template = function(){
    this._parseTemplate(TPL_ROOT);
    this._parseTemplate(DPL_ROOT);
};
/**
 * format config data
 * @protected
 * @param  {Object} data - config data
 * @return {Void}
 */
pro._format = function(data){
    this._super(data);
    // format rules
    this._rules = [];
    // format template
    var ret = {};
    (data.templates||[]).forEach(function(it){
        ret[it.id] = it;
    });
    this._tplmap = ret;
};
/**
 * build deploy config
 * @private
 * @param  {Object} config - config object
 * @param  {Object} options - build options
 * @return {Void}
 */
pro._buildDeploy = function(config,options){
    // build deploy
    var file = _path.absolute(
        './deploy/release.conf',
        config.proRoot
    );
    // check file exist
    if (_fs.exist(file)){
        return;
    }
    // output deploy config
    var content = this._mergeTemplate(
        DPL_ROOT+'release.conf',{
            PROJECT_ID:config.id,
            DIR_WEBROOT:_path.normalize(
                path.relative(path.dirname(file),config.webRoot)+'/'
            ),
            DIR_SOURCE_TP:_path.normalize(
                path.relative(config.webRoot,config.viewRoot)+'/'
            ),
            DIR_OUTPUT_TP:_path.normalize(
                path.relative(
                    config.webRoot,
                    path.dirname(config.viewRoot)+'/views.out/'
                )+'/'
            )
        }
    );
    this._output(file,content.trim());
};
/**
 * build web app
 * @private
 * @param  {Object} config - config object
 * @param  {Object} options - build options
 * @param  {Object} data - nei config data
 * @return {Void}
 */
pro._buildTemplates = function(config,options,data){
    // build template wrap
    this._buildTemplateWrap(
        config.viewRoot+'wrap/'
    );
    // build template page
    this._buildTemplatePage(
        data.templates,config
    );
    // build template mock
    this._buildTemplateMock(
        data.templates,{
            viewRoot:config.viewRoot,
            overwrite:options.overwrite,
            checkTime:options.checkTime
        }
    );
    // build page rules
    this._buildTemplateRules(
        data.pages,{
            viewRoot:config.viewRoot
        }
    );
};
/**
 * build template wrap file
 * @private
 * @param  {String} root - template root
 * @return {Void}
 */
pro._buildTemplateWrap = function(root){
    ['config.ftl','macro.ftl'].forEach(function(name){
        var file = root+name;
        if (!_fs.exist(file)){
            this.emit('debug',{
                data:[file],
                message:'output %s'
            });
            _fs.copy(__dirname+'/webapp/views/wrap/'+name,file);
        }
    },this);
};
/**
 * build template page
 * @private
 * @param  {Array}  list - template definition list
 * @param  {Object} config - config object
 * @param  {String} config.viewRoot - template root path
 * @param  {String} config.webRoot  - web root path
 * @return {Void}
 */
pro._buildTemplatePage = function(list,config){
    var web = config.webRoot,
        root = config.viewRoot;
    (list||[]).forEach(function(it){
        var file = _path.absoluteAltRoot(
            it.path,root,root
        );
        // generate page file name
        // /usr/webapp/views/page/home/test.ftl -> page/home/test
        var filename = file
            .replace(root,'')
            .replace(/\.[^\/]*?$/,'');
        // generate mock file name
        var params = it.parameters||[];
        if (params.length>0){
            it.mock = filename;
        }
        // check page exist
        if (_fs.exist(file)){
            this.emit('debug',{
                data:[file],
                message:'page exist %s'
            });
            return;
        }
        // generate template file content
        var content = this._mergeTemplate(
            TPL_ROOT+'page.ftl',{
                filename:filename,
                title:it.name||'页面标题',
                description:it.description||'页面描述'
            }
        );
        this._output(file,content);
        // build page style
        var file = util.format(
            '%ssrc/css/%s.css',
            web,filename
        );
        this._output(file,'');
        // build page script
        var file = util.format(
            '%ssrc/javascript/%s.js',
            web,filename
        );
        var content = this._mergeTemplate(
            TPL_ROOT+'page.js',{
                // TODO
            }
        );
        this._output(file,content);
    },this);
};
/**
 * build template mock data
 * @private
 * @param  {Array}  list - page template list
 * @param  {Object} config - config object
 * @param  {String}  config.viewRoot  - template root path
 * @param  {Boolean} config.overwrite - whether overwrite mock file existed
 * @param  {Number}  config.checkTime - check time
 * @return {Void}
 */
pro._buildTemplateMock = function(list,config){
    (list||[]).forEach(function(it){
        // check mock file
        var mock = it.mock;
        if (!mock){
            return;
        }
        var file = util.format(
            '%smock/%s.json',
            config.viewRoot,mock
        );
        // check overwrite exist file
        var existed = _fs.exist(file);
        if (existed&&!config.overwrite){
            this.emit('debug',{
                data:[file],
                message:'not overwrite exist template mock file %s'
            });
            return;
        }
        // generate mock parameters
        var ret = {},changed = !1;
        it.parameters.forEach(function(param){
            changed = changed||param.updateTime>config.checkTime;
            ret[param.name] = this._genMockData(param);
        },this);
        // check changed
        if (existed&&!changed){
            this.emit('debug',{
                data:[file],
                message:'template mock file %s not changed'
            });
            return;
        }
        // output mock data
        this._output(file,JSON.stringify(ret,null,4));
        // check filter
        var file = util.format(
            '%smock/%s.js',
            config.viewRoot,mock
        );
        if (!_fs.exist(file)){
            var content = this._mergeTemplate(
                TPL_ROOT+'filter.js'
            );
            this._output(file,content);
        }else{
            this.emit('debug',{
                data:[file],
                message:'mock template filter exist %s'
            });
        }
    },this);
};
/**
 * build page to template rules
 * @private
 * @param  {Array}  list - page definition list
 * @param  {Object} config - config object
 * @param  {String} config.viewRoot - template root path
 * @return {Void}
 */
pro._buildTemplateRules = function(list,config){
    var root = config.viewRoot,
        cache = this._tplmap||{};
    (list||[]).forEach(function(it){
        var tpls = it.templates;
        // check path
        if (!it.path||!tpls||!tpls.length){
            return;
        }
        // dump template list
        var ret = [];
        tpls.forEach(function(id){
            var tpl = cache[id];
            ret.push({
                i:id,
                p:tpl.mock
            })
        });
        // save rules
        this._rules.push({
            method:'GET',
            path:it.path,
            func:util.format(
                'u.r(0,%s)',
                JSON.stringify(ret)
            )
        });
    },this);
};
/**
 * build interface mock data
 * @private
 * @param  {Array}   list - interface list
 * @param  {Object}  config - config object
 * @param  {String}  config.mockRoot  - mock root
 * @param  {Boolean} config.overwrite - whether overwrite exist file
 * @param  {Number}  config.checkTime - check time
 * @return {Void}
 */
pro._buildInterfaceMock = function(list,config){
    var mock = config.mockRoot;
    (list||[]).forEach(function(it){
        var name = it.path.replace(/[^\w\/]|(?:\/$)/g,''),
            method = './'+(API_METHOD[it.method]||'get').toLowerCase()+'/',
            sufix = _path.absoluteAltRoot(method+name,mock,mock);
        it.mock = sufix.replace(mock,'/');
        var file = sufix+'.json',
            existed = _fs.exist(file);
        // check overwrite
        if (existed&&!config.overwrite){
            this.emit('debug',{
                data:[file],
                message:'not overwrite exist api mock file %s'
            });
            return;
        }
        // check changed
        var ret = {},changed = !1;
        (it.outputs||[]).forEach(function(attr){
            changed = changed||attr.updateTime>config.checkTime;
            ret[attr.name] = this._genMockData(attr);
        },this);
        // check changed
        if (existed&&!changed){
            this.emit('debug',{
                data:[file],
                message:'api mock file %s not changed'
            });
            return;
        }
        // output mock file
        this._output(file,JSON.stringify(ret,null,4));
        // output mock filter
        var file = sufix+'.js';
        if (!_fs.exist(file)){
            var content = this._mergeTemplate(
                TPL_ROOT+'filter.js'
            );
            this._output(file,content);
        }else{
            this.emit('debug',{
                data:[file],
                message:'mock api filter exist %s'
            });
        }
    },this);
};
/**
 * build mock filter
 * @private
 * @param  {Array}   list - interface list
 * @param  {Object}  config - config object
 * @param  {String}  config.mockRoot  - mock root
 * @return {Void}
 */
pro._buildInterfaceRules = function(list,config){
    var root = config.mockRoot;
    (list||[]).forEach(function(it){
        this._rules.push({
            path:it.path,
            method:API_METHOD[it.method],
            func:util.format(
                'u.p(%s,"%s")',
                it.id,it.mock
            )
        });
    },this);
};
/**
 * build webapp files
 * @private
 * @param  {Object} config - config object
 * @param  {String} config.webRoot - web root path
 * @param  {Number} config.id      - project id
 * @return {Void}
 */
pro._buildWebAppArch = function(config){
    var root = config.webRoot,
        temp = __dirname+'/webapp/web/';
    // build web app files
    [
        '.bowerrc',
        'res/nej_blank.gif',
        'src/css/base.css',
        'src/javascript/widget/module.js',
        {
            name:'bower.json',
            config:{PRO_NAME:config.id}
        }
    ].forEach(function(it){
        var file = root+it,content;
        if (typeof it!=='string'){
            file = root+it.name;
            content = this._mergeTemplate(
                TPL_ROOT+(it.tpl||it.name),
                it.config
            );
        }
        // check file exist
        if (_fs.exist(file)){
            this.emit('debug',{
                data:[file],
                message:'file exist %s'
            });
            return;
        }
        // output file
        if (content!=null){
            this._output(file,content);
        }else{
            _fs.copy(temp+it,file);
        }
        this.emit('debug',{
            data:[file],
            message:'output %s'
        });
    },this);
    // build webapp directory
    [
        'src/javascript/lib/'
    ].forEach(function(it){
        it = root+it;
        _fs.mkdir(it);
        this.emit('debug',{
            data:[it],
            message:'output %s'
        });
    },this);
};
/**
 * build web app
 * @private
 * @param  {Object} config - config object
 * @param  {Object} options - build options
 * @param  {Object} data - nei config data
 * @return {Void}
 */
pro._buildWebApp = function(config,options,data){
    // build webapp structure
    this._buildWebAppArch(config);
    // build api mock data
    this._buildInterfaceMock(
        data.interfaces,{
            mockRoot:config.webRoot+'src/mock/',
            overwrite:options.overwrite,
            checkTime:options.checkTime
        }
    );
    // build api mock filter
    this._buildInterfaceRules(
        data.interfaces,{
            mockRoot:config.webRoot+'src/mock/'
        }
    );
};
/**
 * build local server config
 * @private
 * @param  {Object} config - config object
 * @param  {String} config.proRoot  - absolute path of project root
 * @param  {String} config.webRoot  - absolute path of web root
 * @param  {String} config.viewRoot - absolute path of server template root
 * @return {Void}
 */
pro._buildServerConfig = function(config){
    // output util.js
    var file = config.proRoot+'nei/';
    var content = this._mergeTemplate(
        TPL_ROOT+'util.js',{
            VIEW_ROOT:_path.normalize(
                path.relative(file,config.viewRoot)+'/'
            ),
            MOCK_WEB:_path.normalize(
                path.relative(file,config.webRoot+'src/javascript/mock')+'/'
            ),
            NEI_MOCK_API:(require('../../package.json').nei||{}).mock
        }
    );
    this._output(file+'util.js',content);
    // output route.js
    var content = this._mergeTemplate(
        TPL_ROOT+'route.js',{
            rules:this._rules
        }
    );
    this._output(file+'route.js',content);
    // output puer.js
    var content = this._mergeTemplate(
        TPL_ROOT+'puer.js',{
            WEB_ROOT:_path.normalize(
                path.relative(file,config.webRoot)+'/'
            )
        }
    );
    this._output(file+'puer.js',content);
    // output server bash
    [
        'server.bat',
        'server.sh'
    ].forEach(function(name){
        _fs.copy(
            TPL_ROOT+name,
            config.proRoot+name
        );
    });
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
    this._buildDeploy(config,options);
    this._buildWebApp(config,options,data);
    this._buildTemplates(config,options,data);
    this._buildServerConfig(config);
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
    this._build.apply(this,arguments);
};
/**
 * do something before build done
 * @param  {Object} config - nei config will be outputted
 * @return {Void}
 */
pro._beforeDone = function(config){
    config.webRoot = config.webRoot.replace(
        config.proRoot,'./'
    );
    config.viewRoot = config.viewRoot.replace(
        config.proRoot,'./'
    );
};