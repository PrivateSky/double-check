var assert = require('../../../../../double-check').assert;

var func = function() {
    throw "Unexpected error!";
}

assert.pass("UnexpectedErrorFail", func);