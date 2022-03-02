var f = $$.flow.describe("equalPrimitiveAndNonPrimPositiveTest",{

    action:function(cb){
        this.cb = cb;
        this.compareDataPrim = [true, false, null, undefined, 1, 1.3, "12"];
        this.compareDataNonPrim = [function(){}, (function(){})(), {}, [], null, {1:1}, [1,2,3] ];
        this.compareDataPrim.forEach(function(element){
            assert.equal(element, element)
        });
        this.compareDataNonPrim.forEach(function(elements){
            assert.equal(elements, elements)
        });
        this.cb();
    },
})();
assert.callback("equalPrimitiveAndNonPrimPositiveTest", function(cb){
    f.action(cb);
}, 1500);


