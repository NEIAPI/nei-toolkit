var engine = {};
{%- if !!freemarker %}
engine.ftl = (require('{{ENGINE_ROOT}}'))();
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