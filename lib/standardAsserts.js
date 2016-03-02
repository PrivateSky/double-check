exports.init = function(sf){
    sf.exceptions.register('assertFail', function(explanation){
        if(explanation){
            throw(new Error("Assert or invariant has failed: " + explanation));
        } else {
            throw(new Error("Assert or invariant has failed"));
        }
    });

    sf.assert.addCheck('equal', function(v1 , v2, explanation){

        if(v1 != v2){
            if(!explanation){
                explanation =  " ["+ v1 + " != " + v2 + "]";
            }

            sf.exceptions.assertFail(explanation);
        }
    });

    sf.assert.addCheck('true', function(b, explanation){
        if(!b){
            if(!explanation){
                explanation =  " expression is false but is expected to be true";
            }

            sf.exceptions.assertFail(explanation);
        }
    });

    sf.assert.addCheck('false', function(b, explanation){
        if(b){
            if(!explanation){
                explanation =  " expression is true but is expected to be false";
            }

            sf.exceptions.assertFail(explanation);
        }
    });

    sf.assert.addCheck('notEqual', function(v1 , v2, explanation){
        if(v1 == v2){
            if(!explanation){
                explanation =  " ["+ v1 + " == " + v2 + "]";
            }
            sf.exceptions.assertFail(explanation);
        }
    });

    sf.assert.addCheck('isNull', function(v1 , explanation){
        if(v1 !== null){
            sf.exceptions.assertFail(explanation);
        }
    });

    function objectHasFields(object,fields){
        for(field in fields) {
            if (object.hasOwnProperty(field)) {
                if (object[field] != fields[field]) {
                    return false;
                }
            }
            else{
                return false;
            }
        }
        return true;
    }

    sf.assert.addCheck("objectHasFields",function(object,fields,explanation){
        if(objectHasFields(object,fields) !== true)
            sf.exceptions.assertFail(explanation);
    })

    sf.assert.addCheck("arraysMatch",function(array,expectedArray,explanation){
        if(array.length !== expectedArray.length){
            sf.exceptions.assertFail(explanation);
        }
        else {
            var arraysDontMatch = expectedArray.some(function (expectedElement) {
                var found = array.some(function(resultElement){
                    return objectHasFields(resultElement,expectedElement);
                });
                return (found === false);
            })


            if(arraysDontMatch){
                sf.exceptions.assertFail(explanation);
            }
        }
    })

    /*
        added mainly for test purposes, better test frameworks like mocha could be much better :)
    */
    sf.assert.addCheck('fail', function(testName ,func){
        try{
            func();
            displayMessage("[Fail] " + testName );
        } catch(err){
            displayMessage("[Pass] " + testName );
        }
    })


    sf.assert.addCheck('pass', function(testName ,func){
        try{
            func();
            console.log("[Pass] " + testName );
        } catch(err){
            console.log("[Fail] " + testName  ,  err.stack);
        }
    });

    sf.assert.alias('test','pass');

    function displayMessage(message,error){
        if(process.env.bulkTesting == 'true'){
            var toBeSent = {
                "message":message
            };
            if(error !== undefined && error.stack){
                toBeSent["stack"] = error.stack.split("\n")
            }
            process.send(toBeSent);
        }else{
            console.log(message);
            if(error!==undefined){
                console.log(error);
            }
        }
    }

    sf.assert.addCheck('callback', function(testName ,func, timeout){
        if(!timeout){
            timeout = 500;
        }

        var passed = false;
        function callback(){
            if(!passed){
                passed = true;
                displayMessage("[Pass] " + testName );
                SuccessTest();
            } else {
                displayMessage("[Fail (multiple calls)] " + testName );
            }
        }
        try{
            func(callback);
        } catch(err){
            displayMessage("[Fail] " + testName  ,  err);
        }

        function SuccessTest(force){
            if(!passed){
                displayMessage("[Fail Timeout] " + testName );


            }

            if(process.env.bulkTesting == 'true'){
                process.exit();
            }
        }

        setTimeout(SuccessTest, timeout)
    });

    sf.assert.addCheck('steps', function(testName , arr, timeout){
        var  currentStep = 0;
        var passed = false;
        if(!timeout){
            timeout = 500;
        }

        function next(){
            if(currentStep == arr.length){
                passed = true;
                displayMessage("[Pass] " + testName );
                return ;
            }
            var func = arr[currentStep];
            currentStep++;
            try{
                func(next);
            } catch(err){
                displayMessage("[Fail] " + testName  ,"\n\t" , err.stack + "\n\t" , " [at step ", currentStep + "]");
            }
        }

        function SuccessTest(force){
            if(!passed){
                displayMessage("[Fail Timeout] " + testName + "\n\t" , " [at step ", currentStep+ "]");
            }
            if(process.env.bulkTesting == 'true'){
                process.exit();
            }
        }

        setTimeout(SuccessTest, timeout);
        next();
    });

    sf.assert.alias('waterfall','steps');

    sf.assert.addCheck('end', function(timeOut, silence){
        if(!timeOut){
            timeOut = 1000;
        }

        setTimeout(function(){
            if(!silence){
                displayMessage("Forcing exit after", timeOut, "ms");
            }
            process.exit(0);
        }, timeOut)
    });

    sf.assert.addCheck('begin', function(message, timeOut){
        displayMessage(message);
        sf.assert.end(timeOut, true);
    });

}