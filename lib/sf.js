

function addUseCase(name, func, paramsDescription, after){

    var newFunc = func;
    if(after){
        newFunc = function(){
            var args = [];
            for(var i= 0,len = arguments.length; i < len; i++){
                args.push(arguments[i]);
            }
            func.apply(this, args);
            after();
        }
    }
    if(name != 'addCheck'){
        this[name]= newFunc;
    } else {
        throw new Error('Cant overwrite addCheck');
    }

    if(paramsDescription){
        this.params[name] = paramsDescription;
    }
}


function alias(name1, name2){
    this.name1 = this.name2;
}

/*
    singleton for adding your various functions for your use cases regarding logging
 */
function LogsCore(){
    this.params = {};
}

/*
 singleton for adding your various functions for assert checks
 */
function AssertCore(){
    this.params = {};
}

/*
 singleton for adding your various functions for generating expcetions
 */
function ExceptionsCore(){
    this.params = {};
}

LogsCore.prototype.addCase           = addUseCase;
AssertCore.prototype.addCheck        = addUseCase;
ExceptionsCore.prototype.register    = addUseCase;

LogsCore.prototype.alias             = alias;
AssertCore.prototype.alias           = alias;
ExceptionsCore.prototype.alias       = alias;

/*
 The semantic firewall,can interfere cu
 */

function Firewall(){

}


var assertObj       = new AssertCore();
var exceptionsObj   = new ExceptionsCore();
var firewallObj     = new Firewall();
var loggerObj       = new LogsCore();


exports.assert      = assertObj;
exports.exceptions  = exceptionsObj;
exports.logger      = loggerObj;
exports.firewall    = firewallObj;

require("./standard.js").init(exports);
