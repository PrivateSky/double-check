const fs = require("fs");
const path = require("path");
const forker = require('child_process');

const configuration_file_name = "double-check.json";

let globToRegExp =  require("./utils/glob-to-regexp");

const TAG = "[TEST_RUNNER]";
const MAX_WORKERS = process.env['DOUBLE_CHECK_POOL_SIZE'] || 10;
const RUNNER_VERBOSE = process.env['DOUBLE_CHECK_RUNNER_VERBOSE'] || true;

const WORKER_PROCESS_STATES = {
    READY: 'ready',
    RUNNING: 'running',
    FINISHED: 'finished'
};

function TestRunner(){

    // Session object
    function initializeSession() {
        return {
            testCount: 0,
            currentTestIndex: 0,
            processedTestCount: 0,
            workers: {
                running: 0,
                terminated: 0
            }
        };
    }

    let defaultConfig = {
        fileExt: ".js",                         // test file supported by extension
        matchDirs: ["*"],
        testDirs: process.cwd(),                // path to the root tests location
        ignore: [".git"],
        reports: {
            basePath: process.cwd(),            // path where the reports will be saved
            prefix: "Report-",                  // prefix for report files, filename pattern: [prefix]-{timestamp}{ext}
            ext: ".txt"                         // report file extension
        }
    };

    // Template structure for test reports.
    let reportFileStructure = {
        count: 0,
        suites: new Set(),
        passed: new Set(),
        failed: new Set()
    };

    let config;

    function init(cfg){

        // no matter how and when runner is exiting first of all do a report print
        let process_exit = process.exit;
        process.exit = (...args)=>{
            process.exit = process_exit;
            doReports(()=>{
                process.exit(...args);
            });
        };

        process.on("SIGINT", process.exit);
        //--------------------------------------------------------------------------------------

        config = extend(defaultConfig, cfg);
        debug("Starting config", config);

        //the testTree holds the tree of directories and files descovered
        this.testTree = {};
        //sorted list of all test files discovered
        this.testList = [];

        this.session = initializeSession();

        // create reports directory if not exist
        if (!fs.existsSync(config.reports.basePath)){
            fs.mkdirSync(config.reports.basePath);
        }
    }

    function getDefaultNodeStructure() {
        return  {
            __meta: {
                conf: null,
                parent: null,
                isDirectory: false
            },
            data: {
                name: null,
                path: null,
            },
            result: {
                state: WORKER_PROCESS_STATES.READY, // ready | running | terminated | timeout
                pass: null,
                executionTime: 0,
                runs: 0,
                asserts: [],
                messages: []
            },
            items: null
        };
    }

    function discoverTestFiles(dir, parentConf) {
        dir = path.resolve(dir);
        const stat = fs.statSync(dir);
        if(!stat.isDirectory()){
            throw new Error(dir + " is not a directory!");
        }

        let currentConf = parentConf;

        let currentNode = getDefaultNodeStructure();
        currentNode.__meta.parent = path.dirname(dir);
        currentNode.__meta.isDirectory = true;

        let files = fs.readdirSync(dir);
        // first look for conf file
        if(files.indexOf(configuration_file_name) !== -1) {
            let fd = path.join(dir, configuration_file_name);
            let conf = readConf(fd);
            if(conf) {
                currentNode.__meta.conf = conf;
                currentConf = extend(currentConf, conf);
                //currentConf = conf;
            }
        }

        currentNode.data.name = path.basename(dir);
        currentNode.data.path = dir;
        currentNode.items = [];

        for(let i = 0, len = files.length; i < len; i++) {
            let item = files[i];

            let fd = path.join(dir, item);
            let stat = fs.statSync(fd);
            let isDir = stat.isDirectory();
            let isTestDir = validateAsTestDir(fd);

            if(isDir && !isTestDir) {
                continue; // ignore dirs that does not follow the naming rule for test dirs
            }

            if(!isDir && item.match(configuration_file_name)){
                continue; // already processed
            }

            // exclude files based on glob patterns
            if(currentConf) {
                // currentConf['ignore'] - array of regExp
                if(currentConf['ignore']) {
                    const isMatch = isAnyMatch(currentConf['ignore'], item);
                    if(isMatch) {continue;}
                }
            }

            let childNode = getDefaultNodeStructure();
            childNode.__meta.conf = {};
            childNode.__meta.isDirectory = isDir;
            childNode.__meta.parent = path.dirname(fd);

            if (isDir) {
                let tempChildNode = discoverTestFiles(fd, currentConf);
                childNode = Object.assign(childNode, tempChildNode);
                currentNode.items.push(childNode);
            }
            else if(path.extname(fd) ===  config.fileExt){
                childNode.__meta.conf.runs = currentConf['runs'] || 1;
                childNode.__meta.conf.silent = currentConf['silent'];

                childNode.data.name = item;
                childNode.data.path = fd;
                reportFileStructure.suites.add(childNode.__meta.parent);
                currentNode.items.push(childNode);
            }
        }

        return currentNode;
    }

    function readConf(confPath) {
        var config = {};
        try{
            config = require(confPath);
        } catch(error) {
            console.error(error);
        }

        return config;
    }

    function validateAsTestDir(dir) {
        if(!config || !config.matchDirs) {
            throw new Error(`matchDirs is not defined on config ${JSON.stringify(config)} does not exist!`);
        }

       let isTestDir = isAnyMatch(config.matchDirs, dir);

        return isTestDir;
    }

    function isAnyMatch(globExpArray, str) {
        const hasMatch = function(globExp) {
            const regex = globToRegExp(globExp);
            return regex.test(str);
        };

        return globExpArray.some(hasMatch);
    }

    let launchTests = () => {

        this.session.testCount = this.testList.length;

        console.log(`Start launching tests (${this.session.testCount})...`);

        reportFileStructure.startDate = new Date().getTime();
        reportFileStructure.count = this.session.testCount;
        if(this.session.testCount > 0) {
            setInterval(scheduleWork, 100);
        } else {
            doReports();
        }
    };

    let scheduleWork = () => {
        //launching tests for each workers available
        while(this.session.workers.running < MAX_WORKERS && this.session.currentTestIndex < this.session.testCount){
            let test = this.testList[this.session.currentTestIndex];
            launchTest(test);
        }
    };

    let launchTest = (test) => {
        this.session.workers.running++;

        test.result.state = WORKER_PROCESS_STATES.RUNNING;

        let env = process.env;

        const cwd = test.__meta.parent;
        console.log("Executing", test.data.path);
        let worker = forker.fork(test.data.path, [], {
                'cwd': cwd,
                'env': env,
                stdio: ["inherit", "pipe", 'pipe', 'ipc'],
                silent: false
            });

        worker.on("exit", onExitEventHandlerWrapper(test));
        worker.on("message", onMessageEventHandlerWrapper(test));
        worker.on("error", onErrorEventHandlerWrapper(test));
        worker.stderr.on("data", messageCaughtOnStdErr(test));

        debug(`Launching test ${test.data.name}, on worker pid[${worker.pid}] `);
        console.log(`Progress: ${this.session.currentTestIndex+1} of ${this.session.testCount}`);

        this.session.currentTestIndex++;

        worker.stdout.on('data', function (dataBuffer) {
            let content = dataBuffer.toString('utf8');
            if (test.__meta.conf.silent) {
                console.log(content);
            }
            test.result.messages.push(content);
        }.bind(this));


        var self = this;

        function onMessageEventHandlerWrapper(test) {
            return function (log) {
                if (log.type === 'assert') {
                    test.result.asserts.push(log);
                } else {
                    test.result.messages.push(log);
                }
            };
        }

        function onExitEventHandlerWrapper(test) {
            return function (code, signal) {
                //clearTimeout(worker.timerVar);
                debug(`Test ${test.data.name} exit with code ${code}, signal ${signal} `);

                test.result.state = WORKER_PROCESS_STATES.FINISHED;
                self.session.processedTestCount++;
                if (code === 0 && test.result.pass === null) {
                    test.result.pass = true;
                    reportFileStructure.passed.add(test);
                } else {
                    test.result.pass = false;
                    reportFileStructure.failed.add(test);
                    test.result.messages.push({
                        message: "Process finished with errors!",
                        "Exit code": code,
                        "Signal": signal
                    });
                }

                self.session.workers.running--;
                self.session.workers.terminated++;

                //scheduleWork();
                checkWorkersStatus();
            };
        }

        // this handler can be triggered when:
        // 1. The process could not be spawned, or
        // 2. The process could not be killed, or
        // 3. Sending a message to the child process failed.
        // IMPORTANT: The 'exit' event may or may not fire after an error has occurred!
        function onErrorEventHandlerWrapper(test) {
            return function (error) {
                if(Buffer.isBuffer(error)){
                    error = error.toString();
                }
                debug(`Worker ${worker.pid} - error event.`, test.data.name);
                //debug(error);

                test.result.pass = false;
                test.result.messages.push(error);

                reportFileStructure.failed.add(test);
                self.session.workers.running--;
                self.session.workers.terminated++;
            };
        }

        function messageCaughtOnStdErr(test) {
            return function (error) {
                if(Buffer.isBuffer(error)){
                    error = error.toString();
                }
                //debug(`Worker ${worker.pid} - error event.`, test.data.name);
                //debug(error);

                test.result.pass = false;
                test.result.messages.push(error);

                reportFileStructure.failed.add(test);
            };
        }
    };

    let checkWorkersStatus = ()=>{
        let remaining = this.session.testCount - this.session.processedTestCount;
        if(this.session.workers.running === 0 && remaining === 0) {
            doReports();
        }else{
            console.log(`Testing still in progress... ${this.session.workers.running} workers busy and ${remaining} tests are waiting to finish.`);
        }
    };

    let reportsAllReadyPrinted = false;
    let doReports = (cb) => {
        if(reportsAllReadyPrinted){
            if(cb){
                cb();
            }
           return;
        }
        reportsAllReadyPrinted = true;
        //doing reports :D
        //on console and html report please!
        reportFileStructure.endDate = new Date().getTime();
        reportFileStructure.runned = this.session.processedTestCount;

        doConsoleReport();

        doHTMLReport((err, res)=>{
            if(cb){
                cb(err, res);
            }
            this.callback(err, this.session);
        });
    };

    let doConsoleReport = () =>{
        console.log("\n\nResults\n==========================");
        console.log(`Finish running ${this.session.processedTestCount} tests from a total of ${this.session.testCount}.`);
        console.log(`\x1b[31m ${reportFileStructure.failed.size} \x1b[0mfailed tests and \x1b[32m ${reportFileStructure.passed.size} \x1b[0mpassed tests.`);

        const sortedTestResults = [...reportFileStructure.failed, ...reportFileStructure.passed];
        const greenCheckbox = '\x1b[32m \u2714 \x1b[0m';
        const redCross = '\x1b[31m \u274C \x1b[0m';

        console.log("==========================\nSummary:");
        for (const test of sortedTestResults) {
            const passed = test.result.pass;

            console.log(` ${passed ? greenCheckbox : redCross} ${test.data.name}`);
            if(!passed){
                console.log(`\t at (${test.data.path}:1:1)`);
            }
        }
        console.log("==========================");
    };

    let doHTMLReport = (cb) => {
        var folderName = path.resolve(__dirname);
        fs.readFile(path.join(folderName,'/utils/report.html'), 'utf8', (err, res) => {
            if (err) {
                debug('An error occurred while reading the html report template file, with the following error: ' + JSON.stringify(err));
                throw err;
            }
            let destination = path.join(process.cwd(), "testReport.html");
            let summary = JSON.parse(JSON.stringify(reportFileStructure));
            summary.failed = Array.from(reportFileStructure.failed);
            summary.passed = Array.from(reportFileStructure.passed);
            summary.suites = Array.from(reportFileStructure.suites);

            let content = res.replace("</html>", `<script>\nprint(${JSON.stringify(summary)});\n</script>\n</html>`);
            fs.writeFile(destination, content, 'utf8', (err) => {
                if (err) {
                    debug('An error occurred while writing the html report file, with the following error: ' + JSON.stringify(err));
                    throw err;
                }

                debug(`Finished writing HTML Report to file://${destination}`);
                if(cb){
                    cb();
                }
            });
        });
    };

    function debug(...args){
        if(!RUNNER_VERBOSE){
            return;
        }

        console.log(...args);
    }

    function extend(first, second) {
        for (const key in second) {
            if (!first.hasOwnProperty(key)) {
                first[key] = second[key];
            } else {
                let val = second[key];
                if(typeof first[key] === 'object') {
                    val = extend(first[key], second[key]);
                }
                first[key] = val;
            }
        }

        return first;
    }

    function testTreeToList(rootNode) {
        var testList = [];

        traverse(rootNode);

        function traverse(node) {
            if(!node.__meta.isDirectory || !node.items) {
                return;
            }

            for(let i = 0, len = node.items.length; i < len; i++) {
                const item = node.items[i];
                if(item.__meta.isDirectory) {
                    traverse(item);
                } else {
                    testList.push(item);
                }
            }
        }

        return testList;
    }

    /**
     * Main entry point. It will start the flow runner flow.
     * @param cfg {Object} - object containing settings such as conf file name, test dir.
     * @param callback {Function} - handler(error, result) invoked when an error occurred or the runner has completed all jobs.
     */
    this.start = function(cfg, callback){

        this.callback = function(err, result) {
            if(err) {
                debug("Sending error to the callback", err);
            }

            if(callback) {
                return callback(err, result);
            }
        };

        init.call(this, cfg);

        console.log("Start discovering tests ...");
        let testTree = [];
        if(Array.isArray(config.testDirs)){
            for(let i=0; i<config.testDirs.length; i++){
                testTree = testTree.concat(discoverTestFiles(config.testDirs[i], config));
            }
        }else{
            testTree = discoverTestFiles(config.testDirs, config);
        }

        this.testList = [];
        for(let i=0; i<testTree.length; i++){
            this.testList = this.testList.concat(testTreeToList(testTree[i]));
        }

        launchTests();
    }
}

exports.init = function(sf) {
    sf.testRunner = new TestRunner();
}
