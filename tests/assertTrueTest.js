require("../../../psknode/bundles/pskruntime"); 
const assert = require("double-check").assert;
var f = $$.flow.describe("assertNotNull",{
    action:function(cb){
        this.cb = cb;
        this.testNegativeDataArray = [false, 0, "", '', null, undefined, 0/1];
        this.testPositiveDataArray = [true, {}, "some string", 3.14, function(){} ];
        this.testPositiveDataArray.forEach(function(element){
            assert.true(element, "Test-true failed, value"+ element+" sould have been validated as true");
        });
        this.testNegativeDataArray.forEach(function(item){
            assert.true(!item, "Test failed, value "+item+" should have been validated as false" );
        });
        this.cb();
    }
})();
assert.callback("assertNotNull", function(cb){
    f.action(cb);
}, 1500);