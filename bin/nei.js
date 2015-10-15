#!/usr/bin/env node

var main = require('../main.js'),
    ut = require('../lib/util/util.js');

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
            ut.complete(opt,{

            });
            opt.project = opt.p||opt.project||'./';
            opt.overwrite = opt.w||opt.overwrite||!1;
            opt.template = opt.t||opt.template||'';
            id.split(/[,;]/).forEach(function(it){
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
        opt.project = opt.p||opt.project||'./';
        opt.overwrite = opt.w||opt.overwrite||!1;
        opt.template = opt.t||opt.template||'';
        if (!!id){
            id.split(/[,;]/).forEach(function(it){
                opt.id = it;
                main.nei(opt);
            });
        }else{
            // update all project
            main.update(opt);
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
            opt.output = opt.o||opt.output||'./';
            opt.overwrite = opt.w||opt.overwrite||!1;
            opt.fiddler = opt.f||opt.fiddler||!1;
            opt.type = parseInt(opt.t,10)||parseInt(opt.template,10)||0;
            main.mock(opt);
        }
    },
    start:function(event){
        event.stopped = !0;

    }
})).exec(
    process.argv.slice(2)
);