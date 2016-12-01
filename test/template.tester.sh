#!/usr/bin/env bash
cd "$(dirname "$0")"
node ../bin/nei.js template -p ./templateTest/input -o ./templateTest/output -d ./templateTest/data.json -b ./templateTest/handlerbars.js -input test -w true