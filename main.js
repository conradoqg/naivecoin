const HttpServer = require('./lib/server');
const Blockchain = require('./lib/blockchain');
const Node = require('./lib/node');
const Operator = require('./lib/operator');
const BlockChainRepository = require('./lib/repository/blockchain');
const OperatorRepository = require('./lib/repository/operator');

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .alias('p', 'http-port')
    .describe('p', 'HTTP port.')
    .describe('peers', 'Peers list.')
    .describe('name', 'Peers list.')
    .array('peers')
    .help('h')
    .alias('h', 'help')
    .argv;

let httpPort = process.env.PORT || process.env.HTTP_PORT || argv.httpPort || 3001;
let peers = (process.env.PEERS ? process.env.PEERS.split(',') : argv.peers || []);
peers = peers.map((peer) => { return { url: peer }; });
var name = process.env.NAME || argv.name || '1';

require('./lib/util/consoleWrapper.js')(name);

let blockchainRepository = new BlockChainRepository(name);
let operatorRepository = new OperatorRepository(name);

let blockchain = new Blockchain(blockchainRepository);
let node = new Node(httpPort, peers, blockchain);
let operator = new Operator(operatorRepository, blockchain);

let httpServer = new HttpServer(httpPort, node, blockchain, operator);