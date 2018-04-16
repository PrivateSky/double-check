var assert = require('../../../../../../double-check').assert;

var func = function() {
    console.log("This is a message from a level 2 test!");
}
assert.pass("level2Sample1", func);