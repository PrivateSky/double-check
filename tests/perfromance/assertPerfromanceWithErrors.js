
const assert = require("../../lib/checksCore").assert;

let TIMEOUT = 3000;

let cfg= {
        timeOut: TIMEOUT,
        parallelCalls:1000,
        testFunction: function (end){
            end(new Error("Fake error"));
        }
};

assert.begin("Performance testing", TIMEOUT + 1000);

assert.performance(cfg, (errs, result) => {
    console.log("Executed successfully ", result.actualRate, " steps per second with ", errs.length, " errors, like for example:" + errs[0]);
});
