var assert = require('../../../../../double-check').assert;

assert.callback("Test level1Sample1 file",function(end){
    assert.fail("Should pass when fails...",function(){throw new Error()});
    end();
});