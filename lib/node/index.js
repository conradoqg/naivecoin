const superagent = require('superagent');
const Block = require('../blockchain/block');
const Blocks = require('../blockchain/blocks');
const Transactions = require('../blockchain/transactions');
const R = require('ramda');
const cron = require('node-cron');

class Node {
    constructor(host, port, peers, blockchain, proxyUrl) {
        this.host = host;
        this.port = port;
        this.peers = [];
        this.proxyUrl = proxyUrl; // This is used if we use a reverse proxy to comminucate with peers, so host:port is useless. 

        this.blockchain = blockchain;
        this.hookBlockchain();
        this.connectToPeers(peers);

        this.checkHeartbeatCron();
    }

    checkHeartbeatCron() {
        cron.schedule('*/2 * * * *', () => { // Check peer heartbeats every 2nd minute.
            if (this.peers.length > 0) { // Only check if we have peers.
                this.checkPeerHeartbeats();
            }
        });
    }

    checkPeerHeartbeats() {
        for (const peer of this.peers) { // Check heartbeat of every peer.
            this.checkHeartbeat(peer);
        }
    }

    hookBlockchain() {
        // Hook blockchain so it can broadcast blocks or transactions changes
        this.blockchain.emitter.on('blockAdded', (block) => {
            this.broadcast(this.sendLatestBlock, block);
        });

        this.blockchain.emitter.on('transactionAdded', (newTransaction) => {
            this.broadcast(this.sendTransaction, newTransaction);
        });

        this.blockchain.emitter.on('blockchainReplaced', (blocks) => {
            this.broadcast(this.sendLatestBlock, R.last(blocks));
        });
    }

    connectToPeer(newPeer) {
        this.connectToPeers([newPeer]);
        return newPeer;
    }

    connectToPeers(newPeers) {
        // Connect to every peer
        let me = this.proxyUrl === null ? `http://${this.host}:${this.port}` : this.proxyUrl;
        
        newPeers.forEach((peer) => {            
            // If it already has that peer, ignore.
            if (!this.peers.find((element) => { return element.url == peer.url; }) && peer.url != me) {
                this.sendPeer(peer, { url: me });
                console.info(`Peer ${peer.url} added to connections.`);
                this.peers.push(peer);
                this.initConnection(peer);
                this.broadcast(this.sendPeer, peer);
            } else {
                console.info(`Peer ${peer.url} not added to connections, because I already have.`);
            }
        }, this);

    }

    initConnection(peer) {
        // It initially gets the latest block and all pending transactions
        this.getLatestBlock(peer);
        this.getTransactions(peer);
    }

    sendPeer(peer, peerToSend) {
        const URL = `${peer.url}/node/peers`;
        console.info(`Sending ${peerToSend.url} to peer ${URL}.`);
        return superagent
            .post(URL)
            .send(peerToSend)
            .catch((err) => {
                console.warn(`Unable to send me to peer ${URL}: ${err.message}`);
            });
    }

    getLatestBlock(peer) {
        const URL = `${peer.url}/blockchain/blocks/latest`;
        let self = this;
        console.info(`Getting latest block from: ${URL}`);
        return superagent
            .get(URL)
            .then((res) => {
                // Check for what to do with the latest block
                self.checkReceivedBlock(Block.fromJson(res.body));
            })
            .catch((err) => {
                console.warn(`Unable to get latest block from ${URL}: ${err.message}`);
            });
    }

    sendLatestBlock(peer, block) {
        const URL = `${peer.url}/blockchain/blocks/latest`;
        console.info(`Posting latest block to: ${URL}`);
        return superagent
            .put(URL)
            .send(block)
            .catch((err) => {
                console.warn(`Unable to post latest block to ${URL}: ${err.message}`);
            });
    }

    getBlocks(peer) {
        const URL = `${peer.url}/blockchain/blocks`;
        let self = this;
        console.info(`Getting blocks from: ${URL}`);
        return superagent
            .get(URL)
            .then((res) => {
                // Check for what to do with the block list
                self.checkReceivedBlocks(Blocks.fromJson(res.body));
            })
            .catch((err) => {
                console.warn(`Unable to get blocks from ${URL}: ${err.message}`);
            });
    }

    sendTransaction(peer, transaction) {
        const URL = `${peer.url}/blockchain/transactions`;
        console.info(`Sending transaction '${transaction.id}' to: '${URL}'`);
        return superagent
            .post(URL)
            .send(transaction)
            .catch((err) => {
                console.warn(`Unable to put transaction to ${URL}: ${err.message}`);
            });
    }

    getTransactions(peer) {
        const URL = `${peer.url}/blockchain/transactions`;
        let self = this;
        console.info(`Getting transactions from: ${URL}`);
        return superagent
            .get(URL)
            .then((res) => {
                self.syncTransactions(Transactions.fromJson(res.body));
            })
            .catch((err) => {
                console.warn(`Unable to get transations from ${URL}: ${err.message}`);
            });
    }

    getConfirmation(peer, transactionId) {
        // Get if the transaction has been confirmed in that peer
        const URL = `${peer.url}/blockchain/blocks/transactions/${transactionId}`;        
        console.info(`Getting transactions from: ${URL}`);
        return superagent
            .get(URL)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    getConfirmations(transactionId) {
        // Get from all peers if the transaction has been confirmed
        let foundLocally = this.blockchain.getTransactionFromBlocks(transactionId) != null ? true : false;
        return Promise.all(R.map((peer) => {
            return this.getConfirmation(peer, transactionId);
        }, this.peers))
            .then((values) => {
                return R.sum([foundLocally, ...values]);
            });
    }

    broadcast(fn, ...args) {
        // Call the function for every peer connected
        console.info('Broadcasting');
        this.peers.map((peer) => {
            fn.apply(this, [peer, ...args]);
        }, this);
    }

    syncTransactions(transactions) {
        // For each received transaction check if we have it, if not, add.
        R.forEach((transaction) => {
            let transactionFound = this.blockchain.getTransactionById(transaction.id);

            if (transactionFound == null) {
                console.info(`Syncing transaction '${transaction.id}'`);
                this.blockchain.addTransaction(transaction);
            }
        }, transactions);
    }

    checkReceivedBlock(block) {
        return this.checkReceivedBlocks([block]);
    }

    checkReceivedBlocks(blocks) {
        const receivedBlocks = blocks.sort((b1, b2) => (b1.index - b2.index));
        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.blockchain.getLastBlock();

        // If the received blockchain is not longer than blockchain. Do nothing.
        if (latestBlockReceived.index <= latestBlockHeld.index) {
            console.info('Received blockchain is not longer than blockchain. Do nothing');
            return false;
        }

        console.info(`Blockchain possibly behind. We got: ${latestBlockHeld.index}, Peer got: ${latestBlockReceived.index}`);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) { // We can append the received block to our chain
            console.info('Appending received block to our chain');
            this.blockchain.addBlock(latestBlockReceived);
            return true;
        } else if (receivedBlocks.length === 1) { // We have to query the chain from our peer
            console.info('Querying chain from our peers');
            this.broadcast(this.getBlocks);
            return null;
        } else { // Received blockchain is longer than current blockchain
            console.info('Received blockchain is longer than current blockchain');
            this.blockchain.replaceChain(receivedBlocks);
            return true;
        }
    }

    checkHeartbeat(peer) {
        const URL = `${peer.url}/node/heartbeat`;
        var self = this;
        return superagent
            .post(URL)
            .then((res) => {
                self.processHeartbeat(peer, true);
            })
            .catch((err) => {
                self.processHeartbeat(peer, false);
                console.warn(`Heartbeat failed for ${URL}: ${err.message} - Removing it from peer list`);
            });
    }

    processHeartbeat(peer, isAlive) {
        if (!isAlive) {
            this.peers = this.peers.filter(x => x.url !== peer.url); // Remove peer from peer list if it's not alive.
        }
    }
}

module.exports = Node;
