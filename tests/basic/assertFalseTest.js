const assert = require("../../lib/checksCore").assert;
var f = $$.flow.describe("assertFalseTest",{

    action:function(cb){
        this.cb = cb;
        this.testPositiveDataArray = [true, {}, "some string", 3.14, function(){} ];
        this.testNegativeDataArray = [false, 0, "", '', null, undefined, 0/1];

        this.testPositiveDataArray.forEach(function (element) {
            assert.false(!element, "Test-true failed, value"+ element +" should have been validated as true");
        });
        this.testNegativeDataArray.forEach(function (item) {
            assert.false(item, "Test failed, value "+ item +" should have been validated as false");
        });
        this.cb();
    },
})();
assert.callback("assertFalseTest", function(cb){
    f.action(cb);
}, 1500);
