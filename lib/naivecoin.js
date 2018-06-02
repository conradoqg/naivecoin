const Config = require('./config');
const HttpServer = require('./httpServer');
const Blockchain = require('./blockchain');
const Operator = require('./operator');
const Miner = require('./miner');
const Node = require('./node');
const ProofSystem = require('./blockchain/proofSystem');

module.exports = function naivecoin(host, port, peers, logLevel, name, broadcastAddress) {
    host = process.env.HOST || host || 'localhost';
    port = process.env.PORT || process.env.HTTP_PORT || port || 3001;
    peers = (process.env.PEERS ? process.env.PEERS.split(',') : peers || []);
    peers = peers.map((peer) => { return { url: peer }; });
    logLevel = (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : logLevel || 6);    
    name = process.env.NAME || name || '1';
    broadcastAddress = process.env.BROADCAST_ADDRESS || broadcastAddress || `http://${host}:${port}`;

    require('./util/consoleWrapper.js')(name, logLevel);

    console.info(`Starting node ${name}`);

    const proofSystem = ProofSystem.create();
    const blockchain = new Blockchain(name, proofSystem);
    const operator = new Operator(name, blockchain);
    const miner = new Miner(blockchain, logLevel, proofSystem);
    const node = new Node(name, host, port, peers, Config.hash, blockchain, broadcastAddress);
    const httpServer = new HttpServer(node, blockchain, operator, miner);

    httpServer.listen(host, port);
};