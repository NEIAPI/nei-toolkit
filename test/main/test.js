//var should = require('should'),
//    main = require('../../main.js'),
//    path = require('../../lib/util/path.js')
//    logger = require('../../lib/util/logger.js').logger;
//
//describe('main',function(){
//
//    var log = function(type,event){
//        var args = event.data||[];
//        args.unshift(event.message||'');
//        logger[type].apply(logger,args);
//    };
//
//    describe('.update(config,callback)',function(){
//
//        it('should ok to update webapp without id',function(done){
//            this.timeout(40000);
//            var root = path.normalize(__dirname+'/');
//            main.update({
//                proRoot:root+'../pro/',
//                done:function(){
//                    done();
//                }
//            });
//        });
//
//    });
//
//});