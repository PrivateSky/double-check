/**
 * Created by ctalmacel on 2/29/16.
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

    var testsOutput = {};

    getTests(function(testFiles){
        if(cluster.isMaster) {
            testFiles.forEach(function (testFile) {
                cluster.fork({"testFile": testFile,
                                "bulkTesting":true}).
                on("message",handleTestMessage(testFile)).
                on("exit",handleExitEvent(testFile));
            })
        }else{
            runTestAsWorker();
        }
    });

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
            var filesCount=files.length;
            var gotDoubleCheck = false;
            var directoryTestFiles = [];
            var excludedFiles = [];

            files.forEach(checkFile);

            function checkFile(fileName) {
                fileName = path+"/"+fileName;
                if (fileName.match("double-check.conf")) {
                    getExcludedFiles(fileName);
                }
                else {
                    fs.stat(fileName, function (err, fileStatus) {
                        if(err){throw err;}

                        if (fileStatus.isDirectory()) {
                            fs.readdir(fileName, function(err,files){
                                checkDirectory(err,files,fileName);
                            });
                        }
                        else {
                            if (fileName.match(".js")) {
                                directoryTestFiles.push(fileName);
                            }
                        }
                        afterFileIsProcessed();
                    })
                }


                function getExcludedFiles(fileName){
                    gotDoubleCheck = true;
                    fs.readFile(fileName, function (err, data) {
                        if (err) {
                            throw err;
                        }
                        data.toString().split(" ").forEach(function(fileName) {
                            excludedFiles.push(fileName);
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
                        callback(directoryTestFiles);
                    }
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
        testsOutput[testFile] = [];
        return function(message) {
            testsOutput[testFile].push(message)
        }
    }

    function handleExitEvent(testFile){
        return function(){
            console.log("\n"+testFile);
            testsOutput[testFile].forEach(function(message){
                console.log(message);
            });

        }
    }
}

function runTestAsWorker(){
    if(process.env["testFile"]===undefined){
        throw new Error("No test file specified");
    }
    require(process.env['testFile']);
}


startTesting();