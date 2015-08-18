var engine = {};
{%- if !!freemarker %}
eingine.ftl = (require('{{WEB_ROOT}}src/javascript/lib/express-freemarker/index.js'))();
{%- endif %}
module.exports={
    "port": 8002,
    "engine": eingine,
    "dir": "{{WEB_ROOT}}",
    "views": "{{VIEW_ROOT}}",
    "inspect": false,
    "reload": false,
    "launch": true,
    "rules": "./route.js"
};