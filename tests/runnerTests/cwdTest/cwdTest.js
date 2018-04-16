const path = require("path");
const testRunner = require('../../../../double-check').testRunner;
const assert = require('../../../../double-check').assert;

var config = {
    testsDir: path.join(__dirname, "sample-tests"),
    reports: {
        basePath: path.join(__dirname, "reports"),
        prefix: "Report-",
        ext: ".txt"
    }
}

testRunner.start(config, callback);

function callback(error, result) {
    if(error) {
        console.error(error);
    } else {
        assert.callback("Should have one pass test!",function(end){
            assert.equal(result.passed.items.length, 1);
            end();
        });
    }
}