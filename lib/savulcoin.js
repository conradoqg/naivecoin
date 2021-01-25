const HttpServer = require('./httpServer');
const Blockchain = require('./blockchain');
const Operator = require('./operator');
const Miner = require('./miner');
const Node = require('./node');
const AutoMiner = require('./miner/autoMiner');

module.exports = function savulcoin(host, port, peers, logLevel, name, proxyUrl, minerMode, rewardAddress, ignoreLocalhost) {
    host = process.env.HOST || host || 'localhost';
    port = process.env.PORT || process.env.HTTP_PORT || port || 3001;
    peers = (process.env.PEERS ? process.env.PEERS.split(',') : peers || []);
    peers = peers.map((peer) => { return { url: peer }; });
    logLevel = (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : logLevel || 6);    
    name = process.env.NAME || name || '1';
    proxyUrl = process.env.PROXY_URL || proxyUrl || null;
    minerMode = process.env.MINER_MODE || (minerMode === 'true') || false;
    rewardAddress = process.env.REWARD_ADDRESS || rewardAddress || null;
    ignoreLocalhost = process.env.IGNORE_LOCALHOST || ignoreLocalhost || false;

    require('./util/consoleWrapper.js')(name, logLevel);

    console.info(`Starting node ${name}`);

    let blockchain = new Blockchain(name);
    let operator = new Operator(name, blockchain);
    let miner = new Miner(blockchain, logLevel);
    let node = new Node(host, port, peers, blockchain, proxyUrl, ignoreLocalhost);
    let httpServer = new HttpServer(node, blockchain, operator, miner);
    let autoMiner = null;

    if (minerMode) {
        autoMiner = new AutoMiner(miner, rewardAddress, blockchain);
    }

    httpServer.listen(host, port);
};