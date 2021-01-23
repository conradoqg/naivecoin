#!/usr/bin/env node
const savulcoin = require('../lib/savulcoin');

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
    .describe('proxyUrl', 'URL of the proxy. (null by default)')
    .array('peers')
    .help('h')
    .alias('h', 'help')
    .argv;

const DEFAULT_PEERS = [
    "savul-n1.yapsavun.com",
    "savul-n2.yapsavun.com"
]

savulcoin(argv.host, argv.port, argv.peers !== undefined ? [...argv.peers, ...DEFAULT_PEERS] : DEFAULT_PEERS, argv.logLevel, argv.name, argv.proxyUrl);