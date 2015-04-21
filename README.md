# SemanticFirewall
SemanticFirewall is a node.js moodule that can be extended to create your own "specific language" to represent asserts, validations, runtime privacy checks. This module is to be used by SwarmESB project.



##Main APIs:

var sf = require("semantic-firewall");

###add verb 
  sf.addVerb("notNull", function(item){
    if(item == null || item == ""){
      throw new Error("Null reference found");
  })

  Check:
  sf.notNull("test");


###alias
  sf.alias("documentId", "notNull");

Check:
  sf.documentId("myDocumentId");

###declare annotation for privacy ontologic tag 

sf.identityField(objectType, field, ontologicTag

 Exemple:
  sf.identityField("User", "SSN", "Social Security Number');
  sf.privateField("User", "birthDate", "Birth Date");
  
###declare rules about use of combinations between identity and private fields



  
  


##annotate with ontology tag 










