var assert = require('../../../../../double-check').assert;

assert.callback("Test level1Sample2 file",function(end){
    assert.equal(1,2);
    end();
});