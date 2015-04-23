exports.init = function(sf){
    sf.exceptions.register('assertFail', function(explanation){
        if(explanation){
            throw("Assert or invariant has failed: " + explanation);
        } else {
            throw("Assert or invariant has failed");
        }
    })

    sf.assert.addCheck('equal', function(v1 , v2, explanation){

        if(v1 != v2){
            if(!explanation){
                explanation =  " ["+ v1 + " != " + v2 + "]";
            }

            sf.exceptions.assertFail(explanation);
        }
    })

    sf.assert.addCheck('notequal', function(v1 , v2, explanation){
        if(v1 == v2){
            if(!explanation){
                explanation =  " ["+ v1 + " == " + v2 + "]";
            }
            sf.exceptions.assertFail(explanation);
        }
    })


    /*
        added mainly for test purposes, better test frameworks like mocha could be much better :)
    */
    sf.assert.addCheck('fail', function(testName ,func){
        try{
            func();
            console.log("  [Fail]" + testName );
        } catch(err){
            console.log("  [Pass]" + testName );
        }
    })


    sf.assert.addCheck('pass', function(testName ,func){
        try{
            func();
            console.log("  [Pass]" + testName );
        } catch(err){
            console.log("  [Fail]" + testName  ,  err);
        }
    })
}