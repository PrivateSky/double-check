const assert = require("../../lib/checksCore").assert;
var f = $$.flow.describe("assertNotEqualNegativeDataTest",{
    action:function(cb) {
        this.cb = cb;
        // this.valueArray1 = [-0, +0, +0, 0, 'foo', false, true, null, undefined];
        // this.valueArray2 = [0, 0, -0, 0, 'foo', false, true, null, undefined];
        this.valueArray1 = [0,   undefined,   undefined, undefined, -Infinity, {}, function() {}, NaN];
        this.valueArray2 = [NaN, 'undefined', null,      NaN,       Infinity,  {}, function() {}, NaN];
        assert.true(this.valueArray1.length === this.valueArray2.length, "Array size should be the same for both arrays");
        for (let i = 0; i < this.valueArray1.length; i++) {
            assert.notEqual(this.valueArray1[i], this.valueArray2[i]);

        }
        this.cb();
    }
})();
assert.callback("assertNotEqualNegativeDataTest", function(cb){
    f.action(cb);
}, 1500);