#!/usr/bin/env bash
cd "$(dirname "$0")"
mocha --require jsdoctest ../../lib/nei/javaWebGenerator.js