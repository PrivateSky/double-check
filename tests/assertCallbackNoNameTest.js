require("../../../psknode/bundles/pskruntime"); 
const assert = require("double-check").assert;
var f = $$.flow.describe("assertCallbackNoName",{
    action:function(cb){
        this.cb = cb;
        this.cb();
    }
})();
assert.callback("Callback simple test",function(cb){
    f.action(cb);
}, 1500);