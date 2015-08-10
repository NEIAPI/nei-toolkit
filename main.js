/*
 * exports toolkit
 * @author   genify(caijf@corp.netease.com)
 */
// klass exports map
var KLASS = {
    // base klass
    Event:'util/event',
    Logger:'util/logger#Logger',
    // nei builder
    NEI_Builder:'nei/builder',
    NEI_WebApp:'nei/webapp'
};
// api exports map
var API = {
    io:'util/io',
    rg:'util/args',
    fs:'util/file',
    ps:'util/path',
    ut:'util/util',
    ks:'util/klass',
    lg:'util/logger#level,logger,log'
};
// export klass or api
function global(map){
    Object.keys(map).forEach(function(key){
        var file = map[key],
            arr = file.split('#'),
            mdl = require('./lib/'+arr[0]+'.js');
        // for util/logger#Logger
        if (!!arr[1]){
            // for util/logger#level,logger
            var brr = arr[1].split(',');
            if (brr.length>1){
                var ret = {};
                brr.forEach(function(name){
                    ret[name] = mdl[name];
                });
                mdl = ret;
            }else{
                mdl = mdl[brr[0]];
            }
        }
        exports[key] = mdl;
    });
};
// export constructor
// export api
global(KLASS);
global(API);

// bin api
var _fs     = require('./lib/util/file.js'),
    _path   = require('./lib/util/path.js'),
    _util   = require('./lib/util/util.js'),
    _log    = require('./lib/util/logger.js'),
    _logger = _log.logger;
/**
 * build nei project
 * @param  {Object} config - config object
 * @param  {String} config.action    - builder action
 * @param  {String} config.id        - nei project id
 * @param  {String} config.project   - path to project root
 * @param  {String} config.template  - path to template output
 * @param  {String} config.overwrite - whether overwrite files existed
 * @param  {Function} callback - build finish callback
 * @return {Void}
 */
exports.nei = function(config,callback){
    var cwd = process.cwd()+'/',
        project = _path.absolute(
            config.project+'/',cwd
        ),
        neiconf = project+'nei/nei.json',
        action = config.action||'build';
    // check nei.json file
    var msg;
    if (_fs.exist(neiconf)){
        if (action==='build'){
            msg = 'use "nei update" to update nei project';
        }
    }else{
        if (action==='update'){
            msg = 'use "nei build" to build nei project';
        }
    }
    if (!!msg){
        _logger.error(msg);
        process.exit(1);
        return;
    }
    // generator builder
    var bmap = {
            webapp:'./lib/nei/webapp.js'
        },
        name = bmap[config.template]||bmap.webapp;
    var Builder;
    try{
        Builder = require(name);
    }catch(ex){
        Builder = require(bmap.webapp);
    }
    // generator config
    var conf = config;
    if (action==='update'){
        conf = require(neiconf);
        conf.overwrite = !!config.overwrite;
    }else{
        conf.updateTime = 0;
    }
    conf = _util.merge(conf,{
        proRoot:project,
        done:callback||function(){},
        debug:_log.log.bind(_log,'debug'),
        info:_log.log.bind(_log,'info'),
        warn:_log.log.bind(_log,'warn'),
        error:_log.log.bind(_log,'error')
    });
    // do build or update
    var builder = new Builder(conf),
        handler = builder[action];
    if (!!handler){
        handler.call(builder);
    }else{
        _logger.error('not supported action %s',action);
    }
};