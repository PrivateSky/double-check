const path = require("path");
const fs = require("fs");
const testRunner = require('../../double-check').testRunner;
console.log(testRunner);
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
		assert.true(fs.existsSync(config.reports.basePath), "Reports dir should be created!");
	}
}