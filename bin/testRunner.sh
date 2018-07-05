#!/bin/bash
node "$(dirname $(readlink -f $0))/testrunner.js" "$@"