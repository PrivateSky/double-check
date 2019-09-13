require("../../../psknode/bundles/pskruntime"); 
const assert = require("double-check").assert;
const positiveTestDataArray = [["", {}, [1, [2, 3]]], ["", {}, [1, [2, 3]]], ["dd", null], ["dd", null], ["1", "dd", null, "aa", "SF"], ["1", "dd", null, "aa", "SF"], [true, false, -0, NaN], [true, false, -0, NaN], [{1: 1}], [{1: 1}]];

const f = $$.flow.describe("assertArrayMatchTest", {
	action: function (cb) {
		this.cb = cb;
		for (let i = 0; i < positiveTestDataArray.length; i += 2) {
			let j = i + 1;
			assert.arraysMatch(positiveTestDataArray[i], positiveTestDataArray[j], 'Arrays at index ' + i + ' and ' + j + ' did not match');
		}

		this.cb();
	}
})();
assert.callback("assertArrayMatchTest", function(cb){
    f.action(cb);
}, 1500);

