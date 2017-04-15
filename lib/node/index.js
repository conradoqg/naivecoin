const superagent = require('superagent');
const Block = require('../blockchain/block');
const Blocks = require('../blockchain/blocks');

class Node {
    constructor(port, peers, blockchain) {
        this.port = port;
        this.peers = [];
        this.blockchain = blockchain;
        this.connectToPeers(peers);
    }

    connectToPeer(newPeer) {
        this.connectToPeers([newPeer]);
    }

    connectToPeers(newPeers) {
        let me = `http://localhost:${this.port}`;
        newPeers.forEach((peer) => {
            if (!this.peers.find((element) => { return element.url == peer.url; }) && peer.url != me) {
                this.sendPeer(peer, { url: me });
                console.log(`Peer ${peer.url} added to connections.`);
                this.peers.push(peer);
                this.initConnection(peer);
                this.broadcast(this.sendPeer, peer);
            } else {
                console.log(`I already have ${peer.url}`);
            }
        }, this);

    }

    initConnection(peer) {
        this.getLatestBlock(peer);
    }

    sendPeer(peer, peerToSend) {
        const URL = `${peer.url}/node/peers/new`;
        superagent
            .post(URL)
            .send(peerToSend)
            .then(() => {
                console.log(`Sending ${peerToSend.url} to peer ${URL}.`);
            })
            .catch((err) => {
                console.log(`Unable to send me to peer ${URL}: ${err.message}`);
            });
    }

    getLatestBlock(peer) {
        const URL = `${peer.url}/blockchain/blocks/latest`;
        let self = this;
        console.log(`Getting latest block from: ${URL}`);
        superagent
            .get(URL)
            .then((res) => {
                self.checkReceivedBlock(Block.fromJson(res.body));
            })
            .catch((err) => {
                console.log(`Unable to get latest block from ${URL}: ${err.message}`);
            });
    }

    sendLatestBlock(peer, block) {
        const URL = `${peer.url}/blockchain/blocks/latest`;
        console.log(`Posting latest block to: ${URL}`);
        superagent
            .post(URL)
            .send(block)
            .catch((err) => {
                console.log(`Unable to post latest block to ${URL}: ${err.message}`);
            });
    }

    getBlocks(peer) {
        const URL = `${peer.url}/blockchain/blocks`;
        let self = this;
        console.log(`Getting blocks from: ${URL}`);
        superagent
            .get(URL)
            .then((res) => {
                self.checkReceivedBlocks(Blocks.fromJson(res.body));
            })
            .catch((err) => {
                console.log(`Unable to get blocks from ${URL}: ${err.message}`);
            });

    }

    sendTransaction() {
        // TODO: Syncronize transactions
    }

    broadcast(fn, ...args) {
        console.log('Broadcasting');
        this.peers.map((peer) => {
            fn.apply(this, [peer, ...args]);
        }, this);
    }

    checkReceivedBlock(block) {
        this.checkReceivedBlocks([block]);
    }

    checkReceivedBlocks(blocks) {
        const receivedBlocks = blocks.sort((b1, b2) => (b1.index - b2.index));
        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.blockchain.getLastBlock();

        if (latestBlockReceived.index <= latestBlockHeld.index) {
            console.log('Checking: Received blockchain is not longer than my blockchain. Do nothing');
            return;
        }

        console.log(`Checking: Blockchain possibly behind. We got: ${latestBlockHeld.index}, Peer got: ${latestBlockReceived.index}`);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log('Checking: We can append the received block to our chain');
            this.blockchain.addBlock(latestBlockReceived);
            this.broadcast(this.sendLatestBlock, latestBlockReceived);
        } else if (receivedBlocks.length === 1) {
            console.log('Checking: We have to query the chain from our peer');
            this.broadcast(this.getBlocks);
        } else {
            console.log('Checking: Received blockchain is longer than current blockchain');
            this.blockchain.replaceChain(receivedBlocks);
            this.broadcast(this.sendLatestBlock, latestBlockReceived);
        }
    }
}

module.exports = Node;
