# SemanticFirewall
SemanticFirewall is a node.js moodule that can be extended to create your own "specific language" to represent asserts, validations, runtime privacy checks. This module is higly experiemnatl and is itented to be used inside projects derived from SwarmESB project.


#APIs:

var sf = require("semantic-firewall");

##add verb 
    sf.addCheck("notNull", function(item){
      if(item == null || item == ""){
        throw new Error("Null reference found");
    })

  Check:
  sf.notNull("test");

##alias
  sf.alias("documentId", "notNull");

Check:
  sf.documentId("myDocumentId");


##declare infomation about ontologic tags 
    sf.tag(tagname, {
        identity:boolean,
        private:boolean,
        sensitivity:0-10,
        related:"list of tags"
        })

Example:

      sf.tag("Social Security Number", {
          identity:true,
          private:true,
          sensitivity:5
          })
        
      sf.tag("Birth Date", {
          identity:false,
          private:true,
          sensitivity:3
          })
          
##declare annotation for privacy ontologic tag 

sf.tag(objectType, field, tagName)

 Example:
 
      sf.tag("User", "SSN",   "Social Security Number");
      sf.tag("User", "birthDate", "Birth Date");
  
###declare rules about use of combinations between identity, private fields and access zones. It is possbile to declare access zones and parent relations between resources and zones  
      sf.grant(zone, resourseType)
      sf.parentZone(zone, parentZone)
      sf.parentResourceType(resourseType, ParentresourseType)

Resource can be: tags, fields, objects, combination of objects with common identity fields
Zones: can be userids, groups, roles,servers, nodenames, etc. 
  For swarms  the zones can be  phases, group of adapters in swarms, tenants, users. roles, etc 


##check usage
      sf.allow(zone, resource, resurceType): boolean

##get report with all usages of private data in zones that don't have declared access in rules
    sf.getReport()
  
  
  

