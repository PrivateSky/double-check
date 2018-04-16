var assert = require('../../../../../double-check').assert;

var func = function() {
    console.log("This is a message 2!");
}
assert.pass("dummy2Level1", func);