const clc = require('cli-color')
const fs = require('fs')

var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
var appdataPath = appdata.replace(/\\/g,'/') + '/Concord Core/';

module.exports = (name, level = 6) => {
  let origConsole = {}

  let simpleWrapper = (typeDescriptor, ...args) => {
    args[0] = new Date().toISOString() + ' - ' + typeDescriptor.color(typeDescriptor.type) + ' - ' + name + ': ' + (args[0] ? args[0] : '')
    if (typeDescriptor.level <= level || typeDescriptor.type === 'log') {
      origConsole.log(...args)
      fs.appendFile(appdataPath + '1/debug.log', String(...args) + "\r\n", (err) => {
        if (err) throw err
      })
    }
  }

  let methods = [
    { type: 'dir', level: 7, color: clc.cyan, wrapper: simpleWrapper },
    { type: 'debug', level: 7, color: clc.magenta, wrapper: simpleWrapper },
    { type: 'time', level: 7, color: clc.magenta, wrapper: simpleWrapper },
    { type: 'timeEnd', level: 7, color: clc.magenta, wrapper: simpleWrapper },
    { type: 'trace', level: 7, color: clc.cyan, wrapper: simpleWrapper },
    { type: 'log', level: 6, color: clc.blue, wrapper: simpleWrapper },
    { type: 'info', level: 6, color: clc.blue, wrapper: simpleWrapper },
    { type: 'warn', level: 4, color: clc.yellow, wrapper: simpleWrapper },
    { type: 'error', level: 3, color: clc.red, wrapper: simpleWrapper },
    { type: 'assert', level: 3, color: clc.cyan, wrapper: simpleWrapper }
  ]

  methods.forEach(function (typeDescriptor) {
    origConsole[typeDescriptor.type] = console[typeDescriptor.type]
    console[typeDescriptor.type] = (...args) => {
      typeDescriptor.wrapper(typeDescriptor, ...args)
    }
  })
}
