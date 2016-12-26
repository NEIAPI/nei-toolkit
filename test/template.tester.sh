#!/usr/bin/env bash
cd "$(dirname "$0")"
node ../bin/nei.js template -p ./templateTest/input -o ./templateTest/output   -input test -w true -author abner -ProductName JustTest --logLevel error