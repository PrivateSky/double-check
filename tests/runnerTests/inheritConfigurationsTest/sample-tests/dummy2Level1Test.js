var assert = require('../../../../../double-check').assert;

var func = function() {
    throw "Unexpected error!";
    console.log("OK2");
}
assert.pass("UnexpectedErrorFail", func);