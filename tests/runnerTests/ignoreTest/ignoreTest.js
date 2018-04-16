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
        assert.callback("Should ignore level1IgnoredTest.js and all *.txt files!", function(end){
            let allTests = result.passed.items.concat(result.failed.items);
            let filesThatShouldBeIgnored = 0;
            for(let i = 0, len = allTests.length; i < len; i++) {
                if(allTests[i].endsWith("level1IgnoredTest.js") || allTests[i].endsWith(".txt")) {
                    filesThatShouldBeIgnored++;
                }
            }
            assert.equal(filesThatShouldBeIgnored, 0);
            end();
        });
    }
}