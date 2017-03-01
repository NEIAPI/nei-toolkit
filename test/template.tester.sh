#!/usr/bin/env bash
cd "$(dirname "$0")"
node ../bin/nei.js template -p ./template-test/input -o ./template-test/output   -input test -w true -author abner -ProductName JustTest --logLevel error