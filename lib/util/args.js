/*
 * arguments from shell parse api
 * @module   exec/args
 * @author   genify(caijf@corp.netease.com)
 */
var util = require('util');
// arguments parser
// package  - package information
// message  - message config, eg. {'-default':['default message'],'help':['message line1','message line2']}
var Arguments = module.exports
    = require('./klass.js').create();
var pro = Arguments.extend(require('./event.js'));
/**
 * class initialization
 * @param  {Object} config - config parameters
 * @return {Void}
 */
pro.init = function(config){
    this._super(config);
    this._package = config.package||{};
    this._messages = config.message||{};
};
/**
 * show message
 * @param  {String} key - message key
 * @return {Void}
 */
pro.show = function(key){
    var msg = this._messages[key];
    if (!msg){
        key = '-default';
        msg = this._messages[key]||'';
    }
    if (util.isArray(msg)){
        msg = msg.join('\n');
    }
    msg = msg.replace(
        '%v',this._package.version
    ).replace(
        '%p',this._params(key)
    );
    this._log(msg);
};
/**
 * exec for arguments list
 * @param  {Array} args - arguments
 * @return {Void}
 */
pro.exec = function(args){
    // parse arguments list
    var ret = this._parse(args),
        opt = ret.options;
    //console.log('%j',ret);
    // check help show
    if (opt.h||opt.help){
        this.show(ret.command);
        this.emit('msg');
        return;
    }
    // check version
    var cmd = (ret.command||'').toLowerCase();
    if (!cmd&&(opt.v||opt.version)){
        this._log('Toolkit Version is %s \n',this._package.version);
        this.emit('msg');
        return;
    }
    // emit command event
    var event = {
        args:ret.args,
        options:ret.options
    };
    if (!!cmd){
        this.emit(cmd,event);
    }
    // check command hit
    if (!event.stopped){
        this.show();
        this.emit('msg');
    }
};
/**
 * 格式化数据简写规则
 * @param {String} key  - 配置标识
 * @param {Object} data - 数据信息
 */
pro.format = function(key,data){
    // check message config
    var list = this._messages[key+'-params'];
    if (!list||!list.length){
        return;
    }
    // map brief name
    var ret = {};
    list.forEach(function(it){
        if (!!it.j){
            ret[it.j] = [
                it.q,it.d==null?'':it.d
            ];
        }else if(data[it.q]==null&&!!it.d){
            data[it.q] = it.d;
        }
    });
    // complete
    Object.keys(ret).forEach(function(key){
        var it = ret[key],
            name = it[0];
        if (data[name]==null){
            data[name] = data[key]||it[1];
        }
        delete data[key];
    });
};
/**
 * show log information
 * @private
 * @param  {String} msg - log message
 * @return {Void}
 */
pro._log = function(msg){
    console.log.apply(console,arguments);
};
/**
 * arguments parse,
 * build -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:[]}
 * build file.js -o /path/to/output/  ---> {command:'build',options:{o:'/path/to/output/'},args:['file.js']}
 * @param  {Array}  argv - arguments list
 * @return {Object} result after parse,eg. {command:'abc',options:{a:true,b:'bbb'},args:['aaaa']}
 */
pro._parse = function(argv){
    var result = {options:{},args:[]};
    // clear space before/after "=" in aguments
    if (util.isArray(argv)){
        argv = argv.join(' ');
    }
    var list = argv.split(/[\s]+/);
    // parse arguments line
    var key;
    list.forEach(function(it){
        // not start with -
        if (it.indexOf('-')!==0){
            // for command
            if (!result.command){
                result.command = it;
                return;
            }
            // for args
            if (!key){
                result.args.push(it);
                return;
            }
            // for value
            result.options[key] = it;
            key = null;
            return;
        }
        // for start with -
        it = it.replace(/^[-]+/,'');
        if (!!key){
            result.options[key] = !0;
        }
        key = it;
    });
    if (!!key){
        result.options[key] = !0;
    }
    return result;
};
/**
 * 参数配置信息
 * @param list
 * @private
 */
pro._params = function(key){
    // param list
    var list = this._messages[key+'-params'];
    if (!list||!list.length){
        return '';
    }
    // generator param list
    var ret = [];
    list.forEach(function(it){
        // support string item
        if (util.isString(it)){
            ret.push(it);
            return;
        }
        // support {j:'xxx',q:'xxxxx',m:'xxxxxx'}
        var msg = '';
        if (!!it.j){
            msg += '-'+it.j;
        }
        if (!!it.q){
            if (!!it.j){
                msg += ', ';
            }
            msg += '--'+it.q;
        }
        if (!!it.m){
            msg += '\t\t'+it.m;
        }
        if (!!msg){
            ret.push(msg);
        }
    });
    return ret.join('\n');
};
