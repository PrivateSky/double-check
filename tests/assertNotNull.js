require("../../../psknode/bundles/pskruntime");
const assert = require("double-check").assert;
var f = $$.flow.describe("assertNotNull",{
    action:function(cb){
        this.cb = cb;
        this.dataArray = [{}, function(){}, true, false, "null" ];
        this.dataArray.forEach(function(element) {
            assert.notNull(element)
        });
        this.cb();
    }
})();
assert.callback("assertNotNull", function(cb){
    f.action(cb);
}, 1500);
