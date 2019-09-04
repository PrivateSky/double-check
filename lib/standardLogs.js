const LOG_LEVELS = {
    HARD_ERROR: 0,  // system level critical error: hardError
    ERROR: 1,  // potentially causing user's data loosing error: error
    LOG_ERROR: 2,  // minor annoyance, recoverable error:   logError
    UX_ERROR: 3,  // user experience causing issues error:  uxError
    WARN: 4,  // warning,possible isues but somehow unclear behaviour: warn
    INFO: 5,  // store general info about the system working: info
    DEBUG: 6,  // system level debug: debug
    LOCAL_DEBUG: 7,  // local node/service debug: ldebug
    USER_DEBUG: 8,  // user level debug; udebug
    DEV_DEBUG: 9,  // development time debug: ddebug
    WHYS: 10, // whyLog for code reasoning
    TEST_RESULT: 11, // testResult to log running tests
};

exports.init = function (sf) {

    /**
     * Records log messages from various use cases.
     * @param record {String} - log message.
     */
    sf.logger.record = function (record) {
        const triggerStrings = ["pskruntime", "double-check"];
        var displayOnConsole = true;
        if (process.send) {
            process.send(record);
            displayOnConsole = false;
        }

        function removeLines(str, nb) {
            function removeLine(str,  force) {
                var pos = str.indexOf("\n");
                var willBeRemoved = str.slice(0, pos);

                if (!force) {
                    var foundMatch = false;
                    for(var i=0; i< triggerStrings.length;i++){
                        let item = triggerStrings[i];
                        if (willBeRemoved.indexOf(item) != -1) {
                            foundMatch = true;
                        }
                    }
                    if (!foundMatch) {
                        throw foundMatch;
                    }
                }
                return str.slice(pos + 1, str.length);
            }

            let ret = str;
            for (let v = 0; v < nb; v++) {
                try {
                    ret = removeLine(ret, v==0);
                } catch (err) {
                    // nothing... exit for
                }
            }
            return ret;
        }

        if (displayOnConsole) {
            //const prettyLog = JSON.stringify(record, null, 2);
            //console.log(prettyLog);
            console.log(record.message);
            if (record.stack) {
                var pos = record.stack.indexOf("\n");
                var message = record.stack.slice(0, pos);
                console.error(message);
                console.error(removeLines(record.stack, 3));
            }
        }
    };

    /**
     * Adding case for logging system level critical errors.
     */
    sf.logger.addCase('hardError', function (message, exception, args, pos, data) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.HARD_ERROR, 'systemError', message, exception, true, args, pos, data));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging potentially causing user's data loosing errors.
     */
    sf.logger.addCase('error', function (message, exception, args, pos, data) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.ERROR, 'error', message, exception, true, args, pos, data));
    }, [
        {
            'message': 'explanation'
        },
        {
            'exception': 'exception'
        }
    ]);

    /**
     * Adding case for logging minor annoyance, recoverable errors.
     */
    sf.logger.addCase('logError', function (message, exception, args, pos, data) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.LOG_ERROR, 'logError', message, exception, true, args, pos, data));
    }, [
        {
            'message': 'explanation'
        },
        {
            'exception': 'exception'
        }
    ]);

    /**
     * Adding case for logging user experience causing issues errors.
     */
    sf.logger.addCase('uxError', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.UX_ERROR, 'uxError', message, null, false));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging throttling messages.
     */
    sf.logger.addCase('throttling', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.WARN, 'throttling', message, null, false));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging warning, possible issues, but somehow unclear behaviours.
     */
    sf.logger.addCase('warning', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.WARN, 'warning', message, null, false, arguments, 0));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    sf.logger.alias('warn', 'warning');

    /**
     * Adding case for logging general info about the system working.
     */
    sf.logger.addCase('info', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.INFO, 'info', message, null, false, arguments, 0));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging system level debug messages.
     */
    sf.logger.addCase('debug', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.DEBUG, 'debug', message, null, false, arguments, 0));
    }, [
        {
            'message': 'explanation'
        }
    ]);


    /**
     * Adding case for logging local node/service debug messages.
     */
    sf.logger.addCase('ldebug', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.LOCAL_DEBUG, 'ldebug', message, null, false, arguments, 0));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging user level debug messages.
     */
    sf.logger.addCase('udebug', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.USER_DEBUG, 'udebug', message, null, false, arguments, 0));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging development debug messages.
     */
    sf.logger.addCase('devel', function (message) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.DEV_DEBUG, 'devel', message, null, false, arguments, 0));
    }, [
        {
            'message': 'explanation'
        }
    ]);

    /**
     * Adding case for logging "whys" reasoning messages.
     */
    sf.logger.addCase("logWhy", function (logOnlyCurrentWhyContext) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.WHYS, 'logwhy', undefined, undefined, undefined, undefined, undefined, undefined, logOnlyCurrentWhyContext));
    });

    /**
     * Adding case for logging asserts messages to running tests.
     */
    sf.logger.addCase("recordAssert", function (message, error, showStack) {
        sf.logger.record(createDebugRecord(LOG_LEVELS.TEST_RESULT, 'assert', message, error, showStack));
    });

    /**
     * Generic method to create structured debug records based on the log level.
     * @param level {Number} - number from 1-11, used to identify the level of attention that a log entry should get from operations point of view
     * @param type {String} - identifier name for log type
     * @param message {String} - description of the debug record
     * @param exception {String} - exception details if any
     * @param saveStack {Boolean} - if set to true, the exception call stack will be added to the debug record
     * @param args {Array} - arguments of the caller function
     * @param pos {Number} - position
     * @param data {String|Number|Array|Object} - payload information
     * @param logOnlyCurrentWhyContext - if whys is enabled, only the current context will be logged
     * @returns Debug record model {Object} with the following fields:
     * [required]: level: *, type: *, timestamp: number, message: *, data: * and
     * [optional]: stack: *, exception: *, args: *, whyLog: *
     */
    function createDebugRecord(level, type, message, exception, saveStack, args, pos, data, logOnlyCurrentWhyContext) {

        var ret = {
            level: level,
            type: type,
            timestamp: (new Date()).getTime(),
            message: message
        };

        if(data){
            ret.data = data;
        }

        if (saveStack) {
            var stack = '';
            if (exception) {
                stack = exception.stack;
            } else {
                stack = (new Error()).stack;
            }
            ret.stack = stack;
        }

        if (exception) {
            ret.exception = exception.message;
        }

        if (args) {
            ret.args = JSON.parse(JSON.stringify(args));
        }

        if (process.env.RUN_WITH_WHYS) {
            var why = require('whys');
            if (logOnlyCurrentWhyContext) {
                ret['whyLog'] = why.getGlobalCurrentContext().getExecutionSummary();
            } else {
                ret['whyLog'] = why.getAllContexts().map(function (context) {
                    return context.getExecutionSummary();
                });
            }
        }
        return ret;
    }

}
;

