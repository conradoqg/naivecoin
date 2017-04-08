const HttpServer = require('./lib/server');
const Blockchain = require('./lib/blockchain');
const PeerToPeer = require('./lib/p2p');
const BlockChainRepository = require('./lib/repository/blockchain');

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
var name = process.env.NAME || argv.name || '1';

const clc = require('cli-color');
let origConsole = {};
origConsole.log = console.log;
console.log = function(...args) {
    origConsole.log(new Date().toISOString() + ' - ' + clc.green('info') + ' - ' + name + ': ', ...args);
};

let repository = new BlockChainRepository(name);
let blockchain = new Blockchain(repository);
let peerToPeer = new PeerToPeer(httpPort, peers, blockchain);
let httpServer = new HttpServer(httpPort, peerToPeer, blockchain);