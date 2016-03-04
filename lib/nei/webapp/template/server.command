puer -c $(cd $(dirname $0); pwd)/puer.js
{%- if mcss %}&
mcss -w 1 -c $(cd $(dirname $0); pwd)/{{WEB_ROOT}}mcss.json
{%- endif %}