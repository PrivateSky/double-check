const assert = require("../../lib/checksCore").assert;

var f = $$.flow.describe("acceptedCallbackType",{
    action:function(cb){
       this.cb = cb;
       this.cb();
    }
})();

var wrongCalls = [null, undefined, {}, "string", true, 5, 0, function(){}.toString(), false];
var goodCalls = [function(cb){f.action(cb);}, (function(callback){return function(cb){f.action(cb);}})()];
var callbackType = wrongCalls.concat(goodCalls);
var counter = 0;

for (var i = 0; i < callbackType.length; i++) {
    try{
        assert.callback("acceptedCallbackType", callbackType[i], 1500);
    }catch(error){
        if(wrongCalls.indexOf(callbackType[i]) !== -1){
            counter++;
        }
    }
}

assert.equal(counter, wrongCalls.length, "Counter should be equal to "+wrongCalls.length+" instead is "+counter);