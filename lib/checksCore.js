/**
 * Generic function used to registers methods such as asserts, logging, etc. on the current context.
 * @param name {String)} - name of the method (use case) to be registered.
 * @param func {Function} - handler to be invoked.
 * @param paramsDescription {Object} - parameters descriptions
 * @param after {Function} - callback function to be called after the function has been executed.
 */
function addUseCase(name, func, paramsDescription, after) {
    var newFunc = func;
    if (typeof after === "function") {
        newFunc = function () {
            const args = Array.from(arguments);
            func.apply(this, args);
            after();
        };
    }

    // some properties should not be overridden
    const protectedProperties = ['addCheck', 'addCase', 'register'];
    if (protectedProperties.indexOf(name) === -1) {
        this[name] = newFunc;
    } else {
        throw new Error('Cant overwrite ' + name);
    }

    if (paramsDescription) {
        this.params[name] = paramsDescription;
    }
}

/**
 * Creates an alias to an existing function.
 * @param name1 {String} - New function name.
 * @param name2 {String} - Existing function name.
 */
function alias(name1, name2) {
    this[name1] = this[name2];
}

/**
 * Singleton for adding various functions for use cases regarding logging.
 * @constructor
 */
function LogsCore() {
    this.params = {};
}

/**
 * Singleton for adding your various functions for asserts.
 * @constructor
 */
function AssertCore() {
    this.params = {};
}

/**
 * Singleton for adding your various functions for checks.
 * @constructor
 */
function CheckCore() {
    this.params = {};
}

/**
 * Singleton for adding your various functions for generating exceptions.
 * @constructor
 */
function ExceptionsCore() {
    this.params = {};
}

/**
 * Singleton for adding your various functions for running tests.
 * @constructor
 */
function TestRunnerCore() {
}

LogsCore.prototype.addCase = addUseCase;
AssertCore.prototype.addCheck = addUseCase;
CheckCore.prototype.addCheck = addUseCase;
ExceptionsCore.prototype.register = addUseCase;

LogsCore.prototype.alias = alias;
AssertCore.prototype.alias = alias;
CheckCore.prototype.alias = alias;
ExceptionsCore.prototype.alias = alias;

// Create modules
var assertObj = new AssertCore();
var checkObj = new CheckCore();
var exceptionsObj = new ExceptionsCore();
var loggerObj = new LogsCore();
var testRunnerObj = new TestRunnerCore();

// Export modules
exports.assert = assertObj;
exports.check = checkObj;
exports.exceptions = exceptionsObj;
exports.logger = loggerObj;
exports.testRunner = testRunnerObj;

// Initialise modules
require("./standardAsserts.js").init(exports, loggerObj);
require("./standardLogs.js").init(exports);
require("./standardExceptions.js").init(exports);
require("./standardChecks.js").init(exports);
require("./runner.js").init(exports);

// Global Uncaught Exception handler.
if (process.on) {
    process.on('uncaughtException', function (err) {
        if (typeof err.isFailedAssert == "undefined") {
            exports.logger.record({
                level: 0,
                message: "double-check has intercepted an uncaught exception",
                stack: err.stack
            });
            exports.assert.forceFailedTest("Uncaught Exception!", err);
        }
    });
}


const fs = require('fs');
const crypto = require('crypto');
const AsyncDispatcher = require('../utils/AsyncDispatcher');
const path = require('path');

function ensureFolderHierarchy(folders, callback) {
    const asyncDispatcher = new AsyncDispatcher(() => {
        callback();
    });

    if (folders.length === 0) {
        return callback();
    }

    asyncDispatcher.dispatchEmpty(folders.length);
    folders.forEach(folder => {
        fs.access(folder, (err) => {
            if (err) {
                fs.mkdir(folder, {recursive: true}, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    asyncDispatcher.markOneAsFinished();
                });
            } else {
                asyncDispatcher.markOneAsFinished();
            }
        });
    });

}

function ensureFilesExist(folders, files, text, callback) {
    if (!Array.isArray(folders)) {
        folders = [folders];
    }

    if (!Array.isArray(files)) {
        files = [files];
    }

    ensureFolderHierarchy(folders, (err) => {
        if (err) {
            return callback(err);
        }

        if (files.length === 0) {
            return callback();
        }

        files.forEach((file, i) => {
            const stream = fs.createWriteStream(file);
            stream.write(text[i]);
            if (i === files.length - 1) {
                return callback();
            }
        });
    });
}


function computeFileHash(filePath, callback) {
    const readStream = fs.createReadStream(filePath);
    const hash = crypto.createHash("sha256");
    readStream.on("data", (data) => {
        hash.update(data);
    });

    readStream.on("close", () => {
        callback(undefined, hash.digest("hex"));
    });
}

function computeFoldersHashes(folders, callback) {
    if (!Array.isArray(folders)) {
        folders = [folders];
    }

    if (folders.length === 0) {
        return callback();
    }

    let hashes = [];
    const asyncDispatcher = new AsyncDispatcher(() => {
        callback(undefined, hashes);
    });

    asyncDispatcher.dispatchEmpty(folders.length);
    folders.forEach(folder => {
        __computeHashRecursively(folder, hashes, (err, hashList) => {
            if (err) {
                return callback(err);
            }

            hashes = hashes.concat(hashList);
            asyncDispatcher.markOneAsFinished();
        });
    });
}

function __computeHashRecursively(folderPath, hashes = [], callback) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return callback(err);
        }

        if (files.length === 0) {
            return callback(undefined, hashes);
        }

        const asyncDispatcher = new AsyncDispatcher(() => {
            callback(undefined, hashes);
        });

        asyncDispatcher.dispatchEmpty(files.length);
        files.forEach(file => {
            const tempPath = path.join(folderPath, file);
            fs.stat(tempPath, (err, stats) => {
                if (err) {
                    return callback(err);
                }

                if (stats.isFile()) {
                    computeFileHash(tempPath, (err, fileHash) => {
                        if (err) {
                            return callback(err);
                        }

                        hashes.push(fileHash);
                        asyncDispatcher.markOneAsFinished();
                    });
                } else {
                    __computeHashRecursively(tempPath, hashes, (err) => {
                        if (err) {
                            return callback(err);
                        }
                        asyncDispatcher.markOneAsFinished();
                    });
                }
            });
        });
    });
}

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmdirSync(folderPath, {recursive: true});
    }
}



function deleteFoldersSync(folders) {
    if (!Array.isArray(folders)) {
        folders = [folders];
    }

    if (folders.length === 0) {
        return;
    }

    folders.forEach(folder => {
        deleteFolderRecursive(folder);
    });
}

function createTestFolder(prefix, cllback) {
    const os = require("os");
    fs.mkdtemp(path.join(os.tmpdir(), prefix), function (err, res) {
        const cleanFolder = function () {
            deleteFolderRecursive(res);
        };
        exports.assert.addCleaningFunction(cleanFolder);
        cllback(err, res);
    });
}

Object.assign(module.exports, {
    deleteFolderRecursive,
    createTestFolder,
    computeFoldersHashes,
    computeFileHash,
    ensureFilesExist,
    deleteFoldersSync
});
