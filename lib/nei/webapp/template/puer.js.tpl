var engine = {};
{%- if !!freemarker %}
engine.ftl = (require('{{WEB_ROOT}}src/javascript/lib/express-freemarker/index.js'))();
{%- endif %}
module.exports={
    "port": 8002,
    "engine": engine,
    "dir": "{{WEB_ROOT}}",
    "views": "{{VIEW_ROOT}}",
    "inspect": false,
    "reload": false,
    "launch": true,
    "offline":false,
    "rules": "./route.js"
};