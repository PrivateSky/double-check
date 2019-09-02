console.log("TestRunner is looking by default for test and tests folders if you want to bypass this run again with --D argument");
console.log("process.argv", process.argv);
//return;

const path = require("path");
const fs = require("fs");
const core = {};
require('../lib/runner').init(core);
const testRunner = core.testRunner;

testRunner.start(null, callback);

function callback(error, result) {
	if(error) {
		console.error(error);
	} else {
		if(!result){
			console.log("Report and results are above, please check console!");
		}else{
			console.log("Finished!");
		}
		process.exit(0);
	}
}