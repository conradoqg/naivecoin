const clc = require('cli-color');

module.exports = (name) => {
    let origConsole = {};

    let simpleWrapper = (typeDescriptor, ...args) => {
        origConsole.log(new Date().toISOString() + ' - ' + typeDescriptor.color(typeDescriptor.type) + ' - ' + name + ': ', ...args);
    };

    let methods = [
        { type: 'log', color: clc.blue, wrapper: simpleWrapper },
        { type: 'info', color: clc.blue, wrapper: simpleWrapper },
        { type: 'debug', color: clc.magenta, wrapper: simpleWrapper },
        { type: 'error', color: clc.red, wrapper: simpleWrapper },
        { type: 'warn', color: clc.yelllow, wrapper: simpleWrapper },
        { type: 'dir', color: clc.cyan, wrapper: simpleWrapper },
        { type: 'time', color: clc.magenta, wrapper: simpleWrapper },
        { type: 'timeEnd', color: clc.magenta, wrapper: simpleWrapper },
        { type: 'trace', color: clc.cyan, wrapper: simpleWrapper },
        { type: 'assert', color: clc.cyan, wrapper: simpleWrapper }
    ];

    methods.forEach(function (typeDescriptor) {
        origConsole[typeDescriptor.type] = console[typeDescriptor.type];
        console[typeDescriptor.type] = (...args) => {
            typeDescriptor.wrapper(typeDescriptor, ...args);
        };
    });    
};