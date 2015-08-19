#!/usr/bin/env node

var main = require('../main.js');

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
    }
})).exec(
    process.argv.slice(2)
);