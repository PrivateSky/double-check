module.exports.init = function (sf, logger) {
    /**
     * Registering handler for failed asserts. The handler is doing logging and is throwing an error.
     * @param explanation {String} - failing reason message.
     */
    let __failWasAlreadyGenerated = false;
    let __assetsCounter = 0;
    let beginWasCalled = false;


    if(typeof global.timeoutUntilBegin === "undefined"){
        global.timeoutUntilBegin = setTimeout(function () {
            if (!beginWasCalled) {
                sf.assert.begin("asset.begin was not called, the exit time for the test is automatically set to 2 seconds. asset.callback can increase this time");
            }
        }, 1000);
    }else{
        console.trace("DoubleCheck was evaluated atleast 2 times! Maybe it was required from disk instead of bundles.");
    }



    /**
     * Registering assert for printing a message and asynchronously printing all logs from logger.dumpWhys.
     * @param message {String} - message to be recorded
     * @param cleanFunctions {Function} - cleaning function
     * @param timeout {Number} - number of milliseconds for the timeout check. Default to 500ms.
     */
    sf.assert.addCheck('forceFailedTest', function (message, err) {
        console.error("Test should fail because:", message, err);
        __failWasAlreadyGenerated = true;
    });

    /**
     * Registering assert for printing a message and asynchronously printing all logs from logger.dumpWhys.
     * @param message {String} - message to be recorded
     * @param cleanFunctions {Function} - cleaning function
     * @param timeout {Number} - number of milliseconds for the timeout check. Default to 500ms.
     */
    sf.assert.addCheck('begin', function (message, cleanFunctions, timeout) {
        //logger.recordAssert(message);
        beginWasCalled = true;
        console.log(message);
        sf.assert.end(cleanFunctions, timeout, true);
    });


    function recordFail(...args) { //record fail only once
        if (!__failWasAlreadyGenerated) {
            __failWasAlreadyGenerated = true;
            logger.recordAssert(...args);
        }
    }

    function delayEnd(message, milliseconds) {
        if (!beginWasCalled) {
            clearTimeout(timeoutUntilBegin);
            sf.assert.begin(message, null, milliseconds);
        } else {
            //console.log('Begin was called before the delay could be applied')
        }
    }

    /**
     * Registering assert for evaluating a value to null. If check fails, the assertFail is invoked.
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.exceptions.register('assertFail', function (explanation) {
        const message = "Assert or invariant has failed " + (explanation ? explanation : "");
        const err = new Error(message);
        err.isFailedAssert = true;
        recordFail('[Fail] ' + message, err, true);
        throw err;
    });

    /**
     * Registering assert for equality. If check fails, the assertFail is invoked.
     * @param v1 {String|Number|Object} - first value
     * @param v1 {String|Number|Object} - second value
     * @param explanation {String} - failing reason message in case the assert fails.
     */
    sf.assert.addCheck('equal', function (v1, v2, explanation) {
        if (v1 !== v2) {
            if (!explanation) {
                explanation = "Assertion failed: [" + v1 + " !== " + v2 + "]";
            }
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Registering assert for inequality. If check fails, the assertFail is invoked.
     * @param v1 {String|Number|Object} - first value
     * @param v1 {String|Number|Object} - second value
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck('notEqual', function (v1, v2, explanation) {
        if (v1 === v2) {
            if (!explanation) {
                explanation = " [" + v1 + " == " + v2 + "]";
            }
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Registering assert for evaluating an expression to true. If check fails, the assertFail is invoked.
     * @param b {Boolean} - result of an expression
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck('true', function (b, explanation) {
        if (!b) {
            if (!explanation) {
                explanation = " expression is false but is expected to be true";
            }
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Registering assert for evaluating an expression to false. If check fails, the assertFail is invoked.
     * @param b {Boolean} - result of an expression
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck('false', function (b, explanation) {
        if (b) {
            if (!explanation) {
                explanation = " expression is true but is expected to be false";
            }
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Registering assert for evaluating a value to null. If check fails, the assertFail is invoked.
     * @param b {Boolean} - result of an expression
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck('isNull', function (v1, explanation) {
        if (v1 !== null) {
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Registering assert for evaluating a value to be not null. If check fails, the assertFail is invoked.
     * @param b {Boolean} - result of an expression
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck('notNull', function (v1, explanation) {
        if (v1 === null && typeof v1 === "object") {
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Checks if all properties of the second object are own properties of the first object.
     * @param firstObj {Object} - first object
     * @param secondObj{Object} - second object
     * @returns {boolean} - returns true, if the check has passed or false otherwise.
     */
    function objectHasFields(firstObj, secondObj) {
        for (let field in secondObj) {
            if (firstObj.hasOwnProperty(field)) {
                if (firstObj[field] !== secondObj[field]) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    function objectsAreEqual(firstObj, secondObj) {
        let areEqual = true;
        if (firstObj !== secondObj) {
            if (typeof firstObj !== typeof secondObj) {
                areEqual = false;
            } else if (Array.isArray(firstObj) && Array.isArray(secondObj)) {
                firstObj.sort();
                secondObj.sort();
                if (firstObj.length !== secondObj.length) {
                    areEqual = false;
                } else {
                    for (let i = 0; i < firstObj.length; ++i) {
                        if (!objectsAreEqual(firstObj[i], secondObj[i])) {
                            areEqual = false;
                            break;
                        }
                    }
                }
            } else if ((typeof firstObj === 'function' && typeof secondObj === 'function') ||
                (firstObj instanceof Date && secondObj instanceof Date) ||
                (firstObj instanceof RegExp && secondObj instanceof RegExp) ||
                (firstObj instanceof String && secondObj instanceof String) ||
                (firstObj instanceof Number && secondObj instanceof Number)) {
                areEqual = firstObj.toString() === secondObj.toString();
            } else if (typeof firstObj === 'object' && typeof secondObj === 'object') {
                areEqual = objectHasFields(firstObj, secondObj);
                // isNaN(undefined) returns true
            } else if (isNaN(firstObj) && isNaN(secondObj) && typeof firstObj === 'number' && typeof secondObj === 'number') {
                areEqual = true;
            } else {
                areEqual = false;
            }
        }

        return areEqual;
    }

    /**
     * Registering assert for evaluating if all properties of the second object are own properties of the first object.
     * If check fails, the assertFail is invoked.
     * @param firstObj {Object} - first object
     * @param secondObj{Object} - second object
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck("objectHasFields", function (firstObj, secondObj, explanation) {
        if (!objectHasFields(firstObj, secondObj)) {
            sf.exceptions.assertFail(explanation);
        }
    });

    /**
     * Registering assert for evaluating if all element from the second array are present in the first array.
     * Deep comparison between the elements of the array is used.
     * If check fails, the assertFail is invoked.
     * @param firstArray {Array}- first array
     * @param secondArray {Array} - second array
     * @param explanation {String} - failing reason message in case the assert fails
     */
    sf.assert.addCheck("arraysMatch", function (firstArray, secondArray, explanation) {
        if (firstArray.length !== secondArray.length) {
            sf.exceptions.assertFail(explanation);
        } else {
            const result = objectsAreEqual(firstArray, secondArray);
            // const arraysDontMatch = secondArray.every(element => firstArray.indexOf(element) !== -1);
            // let arraysDontMatch = secondArray.some(function (expectedElement) {
            //     let found = firstArray.some(function(resultElement){
            //         return objectHasFields(resultElement,expectedElement);
            //     });
            //     return found === false;
            // });

            if (!result) {
                sf.exceptions.assertFail(explanation);
            }
        }
    });

    // added mainly for test purposes, better test frameworks like mocha could be much better

    /**
     * Registering assert for checking if a function is failing.
     * If the function is throwing an exception, the test is passed or failed otherwise.
     * @param testName {String} - test name or description
     * @param func {Function} - function to be invoked
     */
    sf.assert.addCheck('fail', function (testName, func) {
        try {
            func();
            recordFail("[Fail] " + testName);
        } catch (err) {
            logger.recordAssert("[Pass] " + testName);
        }
    });

    /**
     * Registering assert for checking if a function is executed with no exceptions.
     * If the function is not throwing any exception, the test is passed or failed otherwise.
     * @param testName {String} - test name or description
     * @param func {Function} - function to be invoked
     */
    sf.assert.addCheck('pass', function (testName, func) {
        try {
            func();
            logger.recordAssert("[Pass] " + testName);
        } catch (err) {
            recordFail("[Fail] " + testName, err.stack);
        }
    });

    /**
     * Alias for the pass assert.
     */
    sf.assert.alias('test', 'pass');

    /**
     * Registering assert for checking if a callback function is executed before timeout is reached without any exceptions.
     * If the function is throwing any exception or the timeout is reached, the test is failed or passed otherwise.
     * @param testName {String} - test name or description
     * @param func {Function} - function to be invoked
     * @param timeout {Number} - number of milliseconds for the timeout check. Default to 500ms.
     */
    sf.assert.addCheck('callback', function (testName, func, timeout) {

        if (!func || typeof func != "function") {
            throw new Error("Wrong usage of assert.callback!");
        }

        if (!timeout) {
            timeout = 500;
        }

        __assetsCounter++;

        let passed = false;

        function callback() {
            __assetsCounter--;
            if (!passed) {
                passed = true;
                logger.recordAssert("[Pass] " + testName);
                successTest();
            } else {
                recordFail("[Fail (multiple calls)] " + testName);
            }
        }

        setTimeout(successTest, timeout);
        delayEnd(testName, timeout + 100);

        try {
            func(callback);
        } catch (err) {
            recordFail("[Fail] " + testName, err, true);
        }

        function successTest(force) {
            if (!passed) {
                logger.recordAssert("[Fail Timeout] " + testName);
            }
        }


    });

    /**
     * Registering assert for checking if an array of callback functions are executed in a waterfall manner,
     * before timeout is reached without any exceptions.
     * If any of the functions is throwing any exception or the timeout is reached, the test is failed or passed otherwise.
     * @param testName {String} - test name or description
     * @param func {Function} - function to be invoked
     * @param timeout {Number} - number of milliseconds for the timeout check. Default to 500ms.
     */
    sf.assert.addCheck('steps', function (testName, arr, timeout) {
        if (!timeout) {
            timeout = 500;
        }

        let currentStep = 0;
        let passed = false;

        function next() {
            if (currentStep === arr.length) {
                passed = true;
                logger.recordAssert("[Pass] " + testName);
                return;
            }

            const func = arr[currentStep];
            currentStep++;
            try {
                func(next);
            } catch (err) {
                recordFail("[Fail] " + testName + " [at step " + currentStep + "]", err);
            }
        }

        function successTest(force) {
            if (!passed) {
                recordFail("[Fail Timeout] " + testName + " [at step " + currentStep + "]");
            }
        }

        setTimeout(successTest, timeout);
        // delayEnd(testName, timeout + 100);
        next();
    });

    /**
     * Alias for the steps assert.
     */
    sf.assert.alias('waterfall', 'steps');


    let cleaningArray = [];
    /**
     * Registering a cleaning function
     * @param func {Function} - function to be invoked
     */
    sf.assert.addCheck('addCleaningFunction', function (func) {
        cleaningArray.push(func);
    });

    /**
     * Registering a cleaning function
     * @param func {Function} - function to be invoked
     */
    sf.assert.addCheck('disableCleanings', function (func) {
        cleaningArray = [];
    });

    sf.assert.addCheck('hashesAreEqual', function (hash1, hash2) {
        if (!Array.isArray(hash1) && !Array.isArray(hash2)) {
            return hash1 === hash2;
        }

        if (!Array.isArray(hash1) || !Array.isArray(hash2)) {
            return false;
        }

        hash1.sort();
        hash2.sort();
        for (let i in hash1) {
            if (hash1[i] !== hash2[i]) {
                return false;
            }
        }

        return true;
    });

    /**
     * Registering assert for asynchronously printing all execution summary from logger.dumpWhys.
     * @param message {String} - message to be recorded
     * @param timeout {Number} - number of milliseconds for the timeout check. Default to 500ms.
     */
    sf.assert.addCheck('end', function (cleaningFunction, timeout, silence) {
        if (!timeout) {
            timeout = 1000;
        }

        function handler() {
            if (logger.dumpWhys) {
                logger.dumpWhys().forEach(function (c) {
                    const executionSummary = c.getExecutionSummary();
                    console.log(JSON.stringify(executionSummary, null, 4));
                });
            }

            if (!silence) {
                console.log("Forcing exit after", timeout, "ms");
            }

            setTimeout(function () {
                if (__failWasAlreadyGenerated || __assetsCounter != 0) {
                    process.exit(1);
                } else {
                    process.exit(0);
                }
            }, 1000);

            cleaningArray.map(function (func) {
                func();
            });
            if (cleaningFunction) {
                cleaningFunction();
            }
        }

        setTimeout(handler, timeout);
    });


};