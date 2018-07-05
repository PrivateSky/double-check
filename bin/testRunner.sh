#!/bin/bash
node "$(dirname $(readlink -f $0))/testRunner.js" "$@"