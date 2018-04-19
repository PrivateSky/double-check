## Why?         
     
In complex projects the logging infrastructure, uniform error handling mechanisms, automated tests, continuous integration, etc. are very important.  
For best results, exceptions, logging and invariant checks like asserts should work together as smoothly as possible. 
This module is experimental and it is indented to be used inside projects derived from PrivateSky project (but does not have other dependencies). 
Given the distributed nature of PrivateSky projects we decided to build inside double-check module a base to put together logs, exceptions, asserts, checks and other type of semantic checks.
This module is a foundation to grow and control yourself all these aspects. Check our tests to get some usage examples.

## What is double-check module?
DoubleCheck is a node.js module that can be extended to create your own "specific language/API" for
* extensible logging infrastructures
* extensible exception handling mechanisms connected with your logging and asserts infrastructure
* runtime validations called checks that can be added during developement and disabled in production 
        `
##Logging approach

With this module we try to make logging simple to use by programmer during development but also useful at runtime for operations.
The API we offer our logger is extensible, you can add your own verbs (cases as we call them) 
To be fully useful, a logger will perform many roles:
 - keeps a complete history with all relevant events that happened at runtime
 - filters or aggregates semantically related log entries to be easily presented to system administrators or for other audit purposes
 - can help monitoring tools to trigger other events and actions in the system
   

##APIs:

        var assert      = require("double-check").assert;       // get the assert singleton
        var check       = require("double-check").check;        // get the assert singleton
        var throwing    = require("double-check").exceptions;   // get the exceptions singleton
        var logger      = require("double-check").logger;       // get the logger singleton
        
 


###Add new type of assert checks: addCheck 

        assert.addCheck("notNull", function(item){
          if(item == null || item == ""){
            throw new Error("Null reference found");
        });

  Check:  assert.notNull("test");


## Mechanism to control exception types, log important ones

###Add new type of exception: register 
            throwing.register("randomFail", function(explanation){      
                throw new Error("explanation"); //it is mandatory to throw an expcetion, in order to preserve the semantic of throw keyword 
            });

  Usage:  throwing.randomFail("Why not!?");
  

##Logger
###Provide an implementation for rawLogging 
    logger.rawLogging = function(type, level, rawObject, timeStamp, stack){...} 
    
    Observations: 
    - if stack is undefined it should be created from current stack. 
    Give false or other value and the stack will not be saved.
    - if timeStamp is undefined it should be taken from current time, unix time

###Add new type of logging function: addCase
    
    logger.addCase("type", level,  loggingFunction, argument types, checkFunctions) 
    
Observations:
    additionally to make the logging API more appropriate for each case, the loggingFunction has a chance to add other contextual information before calling logger.rawLogging
    checkFunctions  has a chance to trigger actions caused by current log entry or for thresholds violations from previous entries 

Example:

        logger.addCase("warning", function(explanation){
                    this.rawLogging(...)        
              }, [
                    {
                        'name':'explanation'            
                    },
                    {
                        'name':'fileName',
                        'category':true                
                    }
                ], 
                undefined      //we can let it undefined
              })          
        logger.warning("RandomFail happens in this file",__filename);



##Other

###alias
          assert.alias("isDocumentId", "notNull");
          exceptions.alias("randomBreak", "randomFail");
          exceptions.alias("warn", "warning");
            
        
          Usages:
          assert.isDocumentId("myDocumentId");
          exceptions.randomBreak();
  
  
##Conclusions  
 - Start with proper logging policies from beginning: If you don't control how exceptions, asserts and logging code is writeln from the beginning, it can get ugly to modify your code in hundreds of places.
 - Use checks in production code: We encourage use of asserts (called checks) even in production code (to check important invariants) but they should be properly integrated with logging and exceptions. 
 - Early crushes in a controlled environment represent a better option than loosing money because of security issues or other ugly bugs.
 