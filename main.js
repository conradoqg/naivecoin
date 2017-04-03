const HttpServer = require('./lib/server');
const Blockchain = require('./lib/blockchain');
const PeerToPeer = require('./lib/p2p');

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .alias('p', 'http-port')
    .alias('n', 'p2p-port')
    .describe('p', 'HTTP port.')
    .describe('n', 'P2P port.')
    .describe('peers', 'Peers list.')
    .array('peers')    
    .help('h')
    .alias('h', 'help')
    .argv;

let httpPort = process.env.PORT || process.env.HTTP_PORT || argv.httpPort || 3001;
let p2pPort = process.env.P2P_PORT || argv.p2pPort || 6001;
let peers = (process.env.PEERS ? process.env.PEERS.split(',') : argv.peers || []);

let blockchain = new Blockchain();
let peerToPeer = new PeerToPeer(p2pPort, peers, blockchain);
let httpServer = new HttpServer(httpPort, peerToPeer, blockchain);