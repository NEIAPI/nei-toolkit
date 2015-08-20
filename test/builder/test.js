var should = require('should'),
    path = require('../../lib/util/path.js'),
    Builder = require('../../lib/nei/builder.js'),
    logger = require('../../lib/util/logger.js').logger;

describe('nei/builder',function(){

    var log = function(type,event){
        var args = event.data||[];
        args.unshift(event.message||'');
        logger[type].apply(logger,args);
    };

    describe('new Builder',function(){

        it('should ok to generator mock data',function(done){
            this.timeout(40000);
            var root = path.normalize(__dirname+'/');
            (new Builder({
                id:10369,
                overwrite:true,
                proRoot:root+'mock/',
                debug:log.bind(log,'debug'),
                info:log.bind(log,'info'),
                warn:log.bind(log,'warn'),
                error:log.bind(log,'error'),
                done:function(){
                    done();
                }
            })).mock({
                type:2,
                fiddler:true
            });
        });

    });

    
});