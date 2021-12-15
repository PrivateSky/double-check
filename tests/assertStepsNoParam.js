require("../../../psknode/bundles/pskruntime"); 
const assert = require("double-check").assert;

assert.callback("Step test", function(callback){

	let failingMessage = "[Fail Timeout] Test with functions that take parameters [at step 1]";
	let arr = [function a (){}];

	//let oldSend = process.send;
	process.send = function(event){

		if(failingMessage == event.message){
			callback();
		}else{
			console.log(event);
		}
	};

	assert.steps("Test with functions that take parameters", arr);
}, 1000);