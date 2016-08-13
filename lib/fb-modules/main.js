'use strict';

var path = require('path');

// export klass or api
// {
//      key1:'namespace/module',
//      key2:'namespace/module#api1,api2'
//      ...
// }
function global(map){
    Object.keys(map).forEach(function(key){
        var file = map[key],
            arr = file.split('#'),
            ext = path.extname(arr[0]) === '.json' ? '' : '.js',
            mdl = require(`./${arr[0]}${ext}`);
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
// do export
global({
    db:'config/db.json',
    codeMap: 'config/codemap.json',
    errMap: 'config/errormap'
});
