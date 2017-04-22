const HttpServer = require('./lib/server');
const Blockchain = require('./lib/blockchain');
const Operator = require('./lib/operator');
const Miner = require('./lib/miner');
const Node = require('./lib/node');

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .alias('p', 'http-port')
    .describe('p', 'HTTP port.')
    .alias('l', 'log-level')
    .describe('l', 'Log level (7=dir, debug, time and trace, 6=log and info, 4=warn, 3=error, assert).')
    .describe('peers', 'Peers list.')
    .describe('name', 'Peers list.')
    .array('peers')
    .help('h')
    .alias('h', 'help')
    .argv;

let httpPort = process.env.PORT || process.env.HTTP_PORT || argv.httpPort || 3001;
let peers = (process.env.PEERS ? process.env.PEERS.split(',') : argv.peers || []);
let logLevel = (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : argv.logLevel || 6);
peers = peers.map((peer) => { return { url: peer }; });
var name = process.env.NAME || argv.name || '1';

require('./lib/util/consoleWrapper.js')(name, logLevel);

let blockchain = new Blockchain(name);
let operator = new Operator(name, blockchain);
let miner = new Miner(blockchain, logLevel);
let node = new Node(httpPort, peers, blockchain);

let httpServer = new HttpServer(httpPort, node, blockchain, operator, miner);