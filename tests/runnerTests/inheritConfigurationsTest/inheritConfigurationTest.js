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
        assert.callback("Should ignore only first children files, and include files from sub-folders!",function(end){
            let allTests = result.passed.items.concat(result.failed.items);
            let expectedDiscoveredFiles = 1;
            assert.equal(expectedDiscoveredFiles, allTests.length);
            end();
        });
    }
}