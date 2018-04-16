var assert = require('../../../../../../double-check').assert;

var func = function() {
    console.log("This is a message from a level 2 test!");
}
assert.pass("dummy2Level1", func);