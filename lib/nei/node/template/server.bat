start nei server -cf %~dp0jtr.js
{%- if mcss %}&
start mcss -w 1 -c %~dp0{{WEB_ROOT}}mcss.json
{%- endif %}