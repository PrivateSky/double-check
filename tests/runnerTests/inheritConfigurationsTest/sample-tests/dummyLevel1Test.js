var assert = require('../../../../../double-check').assert;

var func = function() {
    console.log("OK");
}
assert.pass("OK", func);