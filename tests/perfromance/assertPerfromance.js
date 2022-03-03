
const assert = require("../../lib/checksCore").assert;

let TIMEOUT = 3000;

let cfg= {
        timeOut: TIMEOUT,
        parallelCalls:100,
        testFunction: function (end){
            end();
        }
};

assert.begin("Performance testing", TIMEOUT + 1000);

assert.performance(cfg, (errs, result) => {
    console.log("Executed successfully ", result.actualRate, " steps per second")

});
