#!/bin/bash

puer -c $(cd $(dirname $0); pwd)/puer.js &
mcss -w -c $(cd $(dirname $0); pwd)/{{WEB_ROOT}}mcss.json
