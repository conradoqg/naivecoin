const logLevel = (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 0);
require('../lib/util/consoleWrapper.js')('naivecoin', logLevel);