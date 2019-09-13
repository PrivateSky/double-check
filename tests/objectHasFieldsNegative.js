require("../../../psknode/bundles/pskruntime");
const assert = require("double-check").assert;
var f = $$.flow.describe("assertObjectHasFields",{
    action:function(cb){
        var locationArray = [1, 2, 3];
        var name = "john";
        var age = 4;
        this.testData = [{location: locationArray}, {location: locationArray}, {name: name}, {name: name}, {age: age, city:"iasi"}, {age: age}];
        this.cb = cb;
        for (var i = 0; i < this.testData.length; i++) {
            assert.objectHasFields(this.testData[i], this.testData[i+1]);
            i+=1;
        };
        this.cb();
    }
})();
assert.callback("assertObjectHasFields", function(cb){
    f.action(cb);
}, 1500);