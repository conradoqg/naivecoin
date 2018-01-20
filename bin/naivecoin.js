#!/usr/bin/env node
const naivecoin = require('./../lib/naivecoin');

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .alias('a', 'host')
    .describe('a', 'Host address. (localhost by default)')
    .alias('p', 'port')
    .describe('p', 'HTTP port. (3001 by default)')
    .alias('l', 'log-level')
    .describe('l', 'Log level (7=dir, debug, time and trace; 6=log and info; 4=warn; 3=error, assert; 6 by default).')
    .describe('peers', 'Peers list.')
    .describe('name', 'Node name/identifier.')
    .array('peers')
    .help('h')
    .alias('h', 'help')
    .argv;

naivecoin(argv.host, argv.port, argv.peers, argv.logLevel, argv.name);