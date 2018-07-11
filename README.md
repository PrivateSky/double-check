## Why?         
     
In complex projects the logging infrastructure, uniform error handling mechanisms, automated tests, continuous integration, etc. are very important.  
For best results, exceptions, logging and invariant checks like asserts should work together as smoothly as possible. 
This module is experimental and it is intended to be used inside projects derived from PrivateSky project (but does not have other dependencies). 
Given the distributed nature of PrivateSky projects we decided to build inside double-check module a base to put together logs, exceptions, asserts, checks and other type of semantic checks.
This module is a foundation to grow and control yourself all these aspects. Check our tests to get some usage examples.

## What is double-check module?
DoubleCheck is a node.js module that can be extended to create your own "specific language/API" for
* extensible logging infrastructures
* extensible exception handling mechanisms connected with your logging and asserts infrastructure
* runtime validations called checks that can be added during development and disabled in production 
        `
## Logging approach

With this module we try to make logging simple to use by programmer during development but also useful at runtime for operations.
The API we offer our logger is extensible, you can add your own verbs (cases as we call them) 
To be fully useful, a logger will perform many roles:
 - keeps a complete history with all relevant events that happened at runtime
 - filters or aggregates semantically related log entries to be easily presented to system administrators or for other audit purposes
 - can help monitoring tools to trigger other events and actions in the system
   

## APIs:
```javascript
     var assert      = require("double-check").assert;       // get the assert singleton
     var check       = require("double-check").check;        // get the assert singleton
     var exceptions  = require("double-check").exceptions;   // get the exceptions singleton
     var logger      = require("double-check").logger;       // get the logger singleton
```
        
        
 

## Assert
### Usage
Here are the methods available for built in checks:

- assert.equal(value1, value2, explanation) - checks equality (using ===) between two values
- assert.notEqual(value1, value2, explanation) - checks inequality (using !==) between two values
- assert.true(expression, explanation) - checks if given expression evaluates to true
- assert.false(expression, explanation) - checks if given expression evaluates to false
- assert.isNull(value, explanation) - checks if given value is null
- assert.notNull(value, explanation) - checks if given value is not null  
- assert.objectHasFields(firstObject, secondObject, explanation) - checks if all properties of the second object are own properties of the first object and that they values match
- assert.arraysMatch(firstArray, secondArray, explanation) - checks if all element from the second array are present in the first array (deep comparison between the elements of the array is used)
  
  
###### Example
```javascript
    const assert = require("double-check").assert;
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2];
    assert.equal('1', 1, "Values don't match");
    assert.true(arr1.length === arr2.length, "Arrays sizes don't match");
```    

##### Observation: if a test fails a log is recorded with the explanation as a message (if provided) and an error is thrown
  Other methods mainly for tests:
   
- assert.fail(testName, func) - checks if a function throws errors
- assert.pass(testName, func) - checks if a functions doesn't throw errors
- assert.test - alias for assert.pass
- assert.callback(testName, func, timeout) - checks if a callback function is executed before timeout is reached without any exceptions
- assert.steps(testName, array, timeout) - checks if an array of callback functions are executed in a waterfall manner, before timeout is reached, without any exceptions
- assert.waterfall - alias for assert.steps
- assert.end(timeout, silence) - asynchronously prints all execution summary from logger.dumpWhys after timeout and kills the current process
- assert.begin(message, timeout) - prints a message and asynchronously printing all logs from logger.dumpWhys (calls assert.end after printing message)


##### Observation: testName parameter is used for logging purposes

#### Add new type of assert checks: addCheck 

        assert.addCheck("notNull", function(item){
          if(item == null || item == ""){
            throw new Error("Null reference found");
        });

  Check:  assert.notNull("test");

## Check
### Usage
  Supports the same methods as assert but it's meant for production and it doesn't throw errors, it just logs them

#### Add new type of exception: register 
            exceptions.register("randomFail", function(explanation){      
                throw new Error(explanation); //it is mandatory to throw an expcetion, in order to preserve the semantic of throw keyword 
            });

  Usage:  exceptions.randomFail("Why not!?");
  

## Logger
### Usage

  Built in methods:

- logger.hardError(message, exception, args, position, data) - for logging system level critical errors
- logger.error(message, exception, args, position, data) - for logging potentially causing user's data loss
- logger.logError(message, exception, args, position, data) - for logging minor annoyance, recoverable errors
- logger.uxError(message) - for logging user experience causing issues
- logger.throttling(message) - for logging throttling messages
- logger.warning(message) - for logging warnings, possible issues, somehow unclear behaviours
- logger.warn - alias for logger.warning
- logger.info(message) - for logging general info about the system working
- logger.debug(message) - for logging system level debug messages
- logger.ldebug(message) - for logging local node/service debug messages
- logger.udebug(message) - for logging user level debug messages
- logger.devel(message) - for logging development debug messages
- logger.logWhy(logOnlyCurrentWhyContext) - logging "whys" reasoning messages
- logger.recordAssert(message, error, showStack) - for logging asserts messages to running tests

##Other

###alias
          assert.alias("isDocumentId", "notNull");
          exceptions.alias("randomBreak", "randomFail");
          exceptions.alias("warn", "warning");
            
        
          Usages:
          assert.isDocumentId("myDocumentId");
          exceptions.randomBreak();
  
  
##Conclusions  
 - Start with proper logging policies from beginning: If you don't control how exceptions, asserts and logging code is written from the beginning, it can get ugly to modify your code in hundreds of places.
 - Use checks in production code: We encourage use of asserts (called checks) even in production code (to check important invariants) but they should be properly integrated with logging and exceptions. 
 - Early crushes in a controlled environment represent a better option than loosing money because of security issues or other ugly bugs.
 