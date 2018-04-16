var assert = require('../../../../../double-check').assert;

var func = function() {
    console.log("This is a message!");
}
assert.pass("dummy1Level1", func);