/*

     Created by ctalmacel on 2/29/16.

    TODO:

    1. pool de procese, 10 default, confgurabil prin variabila de mediu DOUBLE_CHECK_POOL_SIZE  (default 10) --- done

    2. in double-check conf cai relative si dupa un spatiu poate sa apara disable,enable, alone

    3. un timeout de un minut la fiecare fork... opreste automat cu fail testele care dureaza mai mult  --- done ( variabila de mediu TEST_TIMEOUT -- default 10000 ms)

*/

const cluster = require('cluster');

function startTesting(){
    if(cluster.isWorker){
        runTestAsWorker();
    }else{
        startTests();
    }
}

function startTests(){

    var tests = {};
    var testFiles = [];
    var singularRuns = [];
    var maximumNrOfParallelTests = process.env['DOUBLE_CHECK_POOL_SIZE']||10;
    var runningTests = 0;
    var singularRun = false;

    getTests(function(newTestFiles,newSingularRuns) {
        testFiles = testFiles.concat(newTestFiles);
        singularRuns = singularRuns.concat(newSingularRuns);
        launchTests();
    })

    function launchTests(){

        if(singularRun){
            return;
        }

        while(runningTests<maximumNrOfParallelTests&&testFiles.length>0){
            launchTest(testFiles.pop());
        }
        if(runningTests === 0 && singularRuns.length>0){
            singularRun = true;
            launchTest(singularRuns.pop());
        }


        function launchTest(test) {
            console.log("Starting test " + test);
            var worker = cluster.fork({"testFile": test, "bulkTesting": true}).
            on("message", handleTestMessage(test)).
            on("exit", handleExitEvent(test));
            runningTests++;

            setTimeout(function(){
                //console.log(worker);
                if(!worker.isDead) {
                    worker.kill();
                }
            },process.env['TEST_TIMEOUT']||1000);
        }
    }



    function getTests(callback){

        var testsDirectory = getTestsPath();
        var fs = require('fs');
        var testFiles = [];

        fs.readdir(testsDirectory,function(err,files){
            checkDirectory(err,files,testsDirectory);
        });

        function checkDirectory(err,files,path){
            if(err){
                throw(err);
            }

            var directoryPath = path;
            var filesCount=files.length;
            var gotDoubleCheck = false;

            var directoryTestFiles = [];
            var excludedFiles = [];
            var singularRuns = [];


            files.forEach(checkFile);

            function checkFile(fileName) {
                if (fileName.match("double-check.conf")) {
                    parseConfig(fileName);
                }
                else {
                    var path = directoryPath+"/"+fileName;
                    fs.stat(path, function (err, fileStatus) {
                        if(err){throw err;}

                        if (fileStatus.isDirectory()) {
                            fs.readdir(path, function(err,files){
                                checkDirectory(err,files,path);
                            });
                        }
                        else {
                            if (fileName.match(".js")) {
                                directoryTestFiles.push(path);
                            }
                        }
                        afterFileIsProcessed();
                    })
                }
            }

            function parseConfig(fileName){

                gotDoubleCheck = true;
                fs.readFile(directoryPath+"/"+fileName, function (err, data) {
                    if (err) {throw err;}

                    data = data.toString().split("\n").forEach(function(fileInfo) {
                        fileInfo = fileInfo.split(' ');
                        if(fileInfo[1]==="disabled"||fileInfo[1]==="alone") {
                            excludedFiles.push(directoryPath+"/"+fileInfo[0]);
                            if(fileInfo[1]==="alone"){
                                singularRuns.push(directoryPath+"/"+fileInfo[0]);
                            }
                        }
                    })

                    afterFileIsProcessed();
                })
            }

            function afterFileIsProcessed(){
                filesCount--;
                if (filesCount === 0 && gotDoubleCheck) {
                    excludedFiles.forEach(function(file){
                        var index = directoryTestFiles.indexOf(file)
                        if(index>-1){
                            directoryTestFiles.splice(index,1);
                        }
                    })
                    callback(directoryTestFiles,singularRuns);
                }
            }

        }

        function getTestsPath(){
            if(process.argv.length==3){
                return process.argv[2];
            }else{
                return process.cwd();
            }
        }

    }

    function handleTestMessage(testFile){
        tests[testFile] = {
            "output":[],
            "done":false
        };
        return function(message) {
            tests[testFile].done = true;
            tests[testFile].output.push(message)
        }
    }

    function handleExitEvent(testFile){
        return function(){
            runningTests--;
            singularRun = false;
            launchTests();

            if(tests[testFile].done===false){
                console.log("Test "+testFile+" did not terminate properly...");
                return;
            }

            console.log("\nTest: "+testFile);
            tests[testFile].output.forEach(function(message){
                console.log("Message: "+message.message);
                if(message.hasOwnProperty('stack')){
                    console.log('Stack:');
                    message.stack.forEach(function(message){console.log(message)});
                }
            });
            console.log("\n");
        }
    }
}

function runTestAsWorker(){
    if(process.env["testFile"]===undefined){
        throw new Error("No test file specified");
    }
    process.stdout.write = function(){};
    require(process.env['testFile']);
}

startTesting();