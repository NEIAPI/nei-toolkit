// root config
var ROOT = {
    API:'{{NEI_MOCK_API}}',
    VIEW:__dirname+'/{{VIEW_ROOT}}',
    MOCKTPL:__dirname+'/{{VIEW_ROOT}}mock/',
    MOCKAPI:__dirname+'/{{MOCK_WEB}}'
};
// get data from nei
var get = function(type,id,callback){
    var uri = require('util').format(
            ROOT.API,type,id
        ),
        https = /^https:\/\//i.test(uri);
    require(https?'https':'http').get(
        uri,function(res){
            var ret = [];
            res.on('data',function(chunk){
                ret.push(chunk.toString());
            });
            res.on('end',function(){
                var json = null;
                try{
                    json = JSON.parse(ret.join(''));
                }catch(ex){
                    // ignore
                }
                callback(json);
            });
        }
    ).on(
        'error',function(error){
            callback(null);
        }
    );
};
// load data from local cache or nei server
var load = function(type,id,path,callback){
    var filter = null;
    try{
        filter = require(path+'.js');
    }catch(ex){
        // ignore
    }
    // filter is json object
    if (!!filter&&(typeof filter)!=='function'){
        callback(filter);
        return;
    }
    get(type,id,function(json){
        if (json==null){
            try{
                json = require(path+'.json');
            }catch(ex){
                // ignore
            }
        }
        if (!!filter){
            json = filter(json);
        }
        callback(json);
    });
};
// api proxy
exports.p = function(id,path){
    return function(req,res,next){
        load(3,id,ROOT.MOCKAPI+path,function(json){
            res.send(json);
        });
    };
};
// page proxy
exports.r = (function(index,list){
    return function(req,res,next){
        var conf = list[index];
        load(1,conf.i,ROOT.MOCKTPL+conf.p,function(json){
            res.render(ROOT.VIEW+conf.p,json);
        });
    };
})();