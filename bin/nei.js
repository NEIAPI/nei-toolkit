#!/usr/bin/env node

var main = require('../main.js'),
    split = /[,;，；]/;
// run command for single id
var run = function(name,event){
    event.stopped = !0;
    var opt = event.options||{},
        id = (event.args||[])[0];
    if (!id){
        this.show(name);
        process.exit(0);
    }else{
        opt.id = id;
        this.format(name,opt);
        main[name](opt);
    }
};
// run command for batch ids
var batch = function(name,event){
    event.stopped = !0;
    var opt = event.options||{},
        id = (event.args||[])[0]||'';
    if (!id){
        this.show(name);
        process.exit(0);
    }else{
        this.format(name,opt);
        id.split(split).forEach(function(it){
            opt.id = it;
            main[name](opt);
        });
    }
};
// do command
(new (require('../lib/util/args.js'))({
    message:require('./nei.json'),
    package:require('../package.json'),
    msg:function(){
        process.exit(0);
    },
    build:function(event){
        event.stopped = !0;
        var opt = event.options||{},
            id = (event.args||[])[0];
        if (!id){
            this.show('build');
            process.exit(0);
        }else{
            opt.action = 'build';
            this.format(opt.action,opt);
            id.split(split).forEach(function(it){
                opt.id = it;
                main.nei(opt);
            });
        }
    },
    update:function(event){
        event.stopped = !0;
        var opt = event.options||{},
            id = (event.args||[])[0]||'';
        opt.action = 'update';
        this.format(opt.action,opt);
        if (!!id){
            id.split(split).forEach(function(it){
                opt.id = it;
                main.nei(opt);
            });
        }else{
            // update all project
            main.update(opt);
        }
    },
    export:function(event){
        batch.call(this,'export',event);
    },
    mock:function(event){
        run.call(this,'mock',event);
    },
    mobile:function(event){
        run.call(this,'mobile',event);
    }
})).exec(
    process.argv.slice(2)
);