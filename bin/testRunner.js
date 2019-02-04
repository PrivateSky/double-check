console.log("TestRunner is looking by default for test and tests folders if you want to bypass this run again with --D argument");
console.log("process.argv", process.argv);
//return;

const path = require("path");
const fs = require("fs");
const core = require('../lib/checksCore');
const testRunner = core.testRunner;
const assert = core.assert;

var config = {
	reports: {
		testsDir: path.join(process.cwd()),
		prefix: "Report-",
		ext: ".txt"
	}
};
console.log(config);
testRunner.start(config, callback);

function callback(error, result) {
	if(error) {
		console.error(error);
	} else {
        assert.notNull(result, "No result found, please check console!");
	}
	process.exit();
}