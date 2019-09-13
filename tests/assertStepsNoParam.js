require("../../../psknode/bundles/pskruntime"); 
const assert = require("double-check").assert;

assert.callback("Step test", function(callback){

	var faillingMessage = "[Fail Timeout] Test with functions that take parameters [at step 1]";
	var arr = [function a (){}];

	var oldSend = process.send;
	process.send = function(event){

		if(faillingMessage == event.message){
			callback();
		}else{
			console.log(event);
		}
	};

	assert.steps("Test with functions that take parameters", arr);
}, 1000);