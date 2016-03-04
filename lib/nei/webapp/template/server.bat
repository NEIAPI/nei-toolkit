start puer -c %~dp0puer.js
{%- if mcss %}&
start mcss -w 1 -c %~dp0{{WEB_ROOT}}mcss.json
{%- endif %}