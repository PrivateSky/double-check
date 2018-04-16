var assert = require('../../../../../../../double-check').assert;

var func = function() {
    throw "Unexpected error from sub/sub-tests!";
}
assert.pass("UnexpectedErrorFail", func);