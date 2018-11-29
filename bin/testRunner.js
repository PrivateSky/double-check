console.log("TestRunner is looking by default for test and tests folders if you want to bypass this run again with --D argument");
console.log("process.argv", process.argv);
//return;

const path = require("path");
const fs = require("fs");
const testRunner = require('double-check').testRunner;
const assert = require('../lib/checksCore').assert;

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
}