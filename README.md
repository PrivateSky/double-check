## Why?         
     
In complex projects you have to invest in logging infrastructure and uniform error handling mechanisms.  
For best results, exceptions, logging and invariant checks with assert functions should work toghether as smoothly as possible. 
With this module we offer a foundation to grow and control all these aspects. 
For example, if you have to add anytime (later) code to perform some specific actions when some types of exceptions happens. 
If you don't control how exceptions, asserts and logging code is writeln from the beginning, it can be ugly to modify code in hundreds of places.       
In this module we also provide a semantic firewall innovation that will be using the logger but add a new dimension to assert checks.             
This module is experimental and it is itented mainly to be used inside projects derived from SwarmESB project (but does not have other dependencies).


## What is semantic-firewall module?
SemanticFirewall is a node.js moodule that can be extended to create your own "specific language/API" for  
    - asserts and runtime validations (throw exceptions)     
    - extensible logging infrastructures
    - extensible exception handling mechanisms connected with your logging and asserts infrastructure
    - extensible semantic firewall for executable choreographies (runtime security and privacy checks). 
        
        
##Logging approach

We this module we try to make logging booth simple to use by programmer during development but also useful at runtime for operations.
The API we offer our logger is extensible, you can add your own verbs (cases as we call them) 
To be fully useful, a logger will perform many roles:
 - keeps a complete history with all relevant events that happened at runtime
 - filters or aggregates semantically related log entries to be easily presented to system administrators or for other audit purposes
 - can help monitoring tools to trigger other events and actions in the system 
    
Therefore, all the extensions you can declare should also declare a semantic category for each parameter, declared as an array of objects in logger.addCase calls.
   We identified the following semantic categories having booleans as values:
   - 'category': the field is usable to create indexes for logs. The mandatory field "type" is such ca category but you can add other. One can see ca category    
   - 'level' : identify the level of attention that a log entry should get from operations point of view 
   - 'time': a value that uniquely identifies in time the log. This parameter is mandatory and normally automatically instantiated by core logging functions
   - 'description' : part of the description, environment values relevant for values. All parameters have this aspect so you don't declare
   - 'stack' : describe an execution stack that caused the log entry   
   - 'filename' : path of a file causing or related to the log entry
   - 'key part': a set of fields that together create a key (category)  
   - 'swarm'   : the current swarm name (SwarmESB specific)
   - 'phase'   : the current phase name (SwarmESB specific)
   - 'mainGroup'   : the type of the addapter  (SwarmESB specific)
   - 'adapter'     : the uid of the current adapter instance ((SwarmESb specific))
   - 'swarm process': the uid of a swarm process
   
   Additionally,each parameter declaration should have a name, identified with field named 'name' in parameter descriptions 
   
   

##APIs:

            var assert      = require("semantic-firewall").assert;      //get the assert singleton
            var throwing    = require("semantic-firewall").exceptions;  //get the exceptions singleton
            var firewall    = require("semantic-firewall").firewall;    //get the firewall singleton
            var logger      = require("semantic-firewall").logger;      //get the logger singleton
            
            /* proposed, not implemented in the current version */
            //creates a dependency injection container in the name space given as parameter
            var container    = require("semantic-firewall").dicontainer('name'); 


###Add new type of assert checks: addCheck 
            assert.addCheck("notNull", function(item){
              if(item == null || item == ""){
                throw new Error("Null reference found");
            })

  Check:
  assert.notNull("test");


## Mechanism to control exception types, log important ones

###Add new type of exception: register 
            throwing.register("randomFail", function(explanation){      
                throw new Error("explanation"); //it is mandatory to throw an expcetion, in order to preserve the semantic of throw keyword 
            })

  Usage:
  throwing.randomFail("Why not!?");
  

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
    additionaly to make the logging API mor apropiate for each case,  the loggingFunction has a chance to add other contextual information before calling logger.rawLogging
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

##Ontological semantic firewall (not really fully implemented yet, wip)

###declare infomation about ontologic tags 

            firewall.tag(tagname, {
                identity:boolean,
                private:boolean,
                sensitivity:0-10,
                related:"list of tags"
                })

    Example:

          firewall.tag("Social Security Number", {
              identity:true,
              private:true,
              sensitivity:5
              })
            
          firewall.tag("Birth Date", {
              identity:false,
              private:true,
              sensitivity:3
              })
              
###Declare annotation for privacy ontologic tag 

    firewall.tag(objectType, field, tagName)

 Example:
 
          firewall.tag("User", "SSN",   "Social Security Number");
          firewall.tag("User", "birthDate", "Birth Date");
  
###Declare rules about use of combinations between identity, private fields and access zones. It is possbile to declare access zones and parent relations between resources and zones  
          firewall.grant(zone, resourseType)
          firewall.parentZone(zone, parentZone)
          firewall.parentResourceType(resourseType, ParentresourseType)

Resource can be: tags, fields, objects, combination of objects with common identity fields
Zones: can be userids, groups, roles,servers, nodenames, etc. 
  For swarms  the zones can be  phases, group of adapters in swarms, tenants, users. roles, etc 


###Check usage
        firewall.allow(zone, resource, resurceType): boolean

##Get a report with all usages of private data in zones that don't have declared access in rules
          firewall.getReport()
  
  
  

