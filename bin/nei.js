#!/usr/bin/env node

var main = require('../main.js'),
    split = /[,;，；]/;

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
        event.stopped = !0;
        var opt = event.options||{},
            id = (event.args||[])[0]||'';
        if (!id){
            this.show('export');
            process.exit(0);
        }else{
            this.format('export',opt);
            id.split(split).forEach(function(it){
                opt.id = it;
                main.export(opt);
            });
        }
    },
    mock:function(event){
        event.stopped = !0;
        var opt = event.options||{},
            id = (event.args||[])[0];
        if (!id){
            this.show('mock');
            process.exit(0);
        }else{
            opt.id = id;
            this.format('mock',opt);
            main.mock(opt);
        }
    }
})).exec(
    process.argv.slice(2)
);