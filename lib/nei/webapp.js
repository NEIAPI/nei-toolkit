/*
 * WebApp Builder
 * @module   nei/webapp
 * @author   genify(caijf@corp.netease.com)
 */
var path  = require('path'),
    util  = require('util'),
   _fs    = require('../util/file.js'),
   _path  = require('../util/path.js');
// template root
var TPL_ROOT = __dirname+'/webapp/template/';
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
            config.viewRoot||'./src/main/webapp/WEB-INF/views/',
            config.proRoot
        ),
        engine:config.engine||'freemarker'
    };
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
        TPL_ROOT+'release.conf',{
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
        config.viewRoot+'common/'
    );
    // build template page
    this._buildTemplatePage(
        data.templates,config
    );
    // build template mock
    this._buildTemplateMock(
        data.templates,{
            mockRoot:config.viewRoot+'mock/',
            overwrite:options.overwrite,
            checkTime:options.checkTime,
            filter:TPL_ROOT+'filter.js'
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
            _fs.copy(__dirname+'/webapp/views/common/'+name,file);
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
        var filename = this._parseFileName(
            it.path,root
        );
        it.mock = filename;
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
        // build page mcss code
        var file = util.format(
            '%ssrc/mcss/%s.mcss',
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
        'mcss.json',
        'res/nej_blank.gif',
        'src/css/base.css',
        'src/javascript/widget/module.js',
        'src/mcss/_prefix.mcss',
        'src/mcss/_config.mcss',
        'src/mcss/base.mcss',
        {
            name:'bower.json',
            config:{
                PRO_NAME:config.id,
                freemarker:config.engine==='freemarker'
            }
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
            checkTime:options.checkTime,
            filter:TPL_ROOT+'filter.js'
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
pro._buildServerConfig = (function(){
    var suffix = {
        freemarker:'ftl',
        velocity:'vm'
    };
    return function(config){
        // output file config
        var file = this._cnfRoot,
            webRoot = _path.normalize(
                path.relative(file,config.webRoot)+'/'
            ),
            viewRoot = _path.normalize(
                path.relative(file,config.viewRoot)+'/'
            ),
            fmap = {
                'util.js':{
                    VIEW_ROOT:viewRoot,
                    VIEW_EXTENTION:suffix[config.engine]||'js',
                    MOCK_WEB:webRoot+'src/javascript/mock/',
                    NEI_MOCK_API:(require('../../package.json').nei||{}).mock
                },
                'route.js':{
                    rules:this._rules
                },
                'puer.js':{
                    WEB_ROOT:webRoot,
                    VIEW_ROOT:viewRoot,
                    freemarker:config.engine==='freemarker'
                },
                'server.bat':{
                    WEB_ROOT:webRoot
                },
                'server.sh':{
                    WEB_ROOT:webRoot
                }
            };
        // output server config
        Object.keys(fmap).forEach(function(name){
            var content = this._mergeTemplate(
                TPL_ROOT+name,fmap[name]
            );
            this._output(file+name,content);
        },this);
    };
})();
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
    this._buildWebApp(config,options,data);
    this._buildTemplates(config,options,data);
    this._buildServerConfig(config);
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