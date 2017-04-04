const Block = require('./block');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const BLOCKCHAIN_FILE = 'blockchain.json';

class Blockchain {
    constructor(name) {
        this.dataFile = 'data' + name + '/' + BLOCKCHAIN_FILE;
        this.blockchain = readBlockchainFromFile(this.dataFile) || [Block.genesis];
    }

    get() {
        return this.blockchain;
    }

    get latestBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    mine(seed) {
        const newBlock = this.generateNextBlock(seed);
        this.addBlock(newBlock);
        return newBlock;
    }

    replaceChain(newBlocks) {
        if (!this.isValidChain(newBlocks) || newBlocks.length <= this.blockchain.length) {
            console.log('Received blockchain invalid');
            return;
        }

        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        this.blockchain = newBlocks;
        writeBlockchainToFile(this.dataFile, this.blockchain);
    }

    isValidChain(blockchainToValidate) {
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(Block.genesis)) {
            return false;
        }

        const tempBlocks = [blockchainToValidate[0]];
        for (let i = 1; i < blockchainToValidate.length; i++) {
            if (this.isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
                tempBlocks.push(blockchainToValidate[i]);
            } else {
                return false;
            }
        }
        return true;
    }

    addBlock(newBlock) {
        if (this.isValidNewBlock(newBlock, this.latestBlock)) {
            this.blockchain.push(newBlock);
            writeBlockchainToFile(this.dataFile, this.blockchain);
        }
    }

    calculateHashForBlock(block) {
        return this.calculateHash(block.index, block.previousHash, block.timestamp, block.data);
    }

    calculateHash(index, previousHash, timestamp, data) {
        return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
    }

    isValidNewBlock(newBlock, previousBlock) {
        const blockHash = this.calculateHashForBlock(newBlock);

        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('Invalid index');
            return false;
        } else if (previousBlock.hash !== newBlock.previousHash) {
            console.log('Invalid previoushash');
            return false;
        } else if (blockHash !== newBlock.hash) {
            console.log(typeof (newBlock.hash) + ' ' + typeof blockHash);
            console.log(`Invalid hash: ${blockHash} ${newBlock.hash}`);
            return false;
        }
        return true;
    }

    generateNextBlock(blockData) {
        const previousBlock = this.latestBlock;
        const nextIndex = previousBlock.index + 1;
        const nextTimestamp = new Date().getTime() / 1000;
        const nextHash = this.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
        return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
    }
}

var writeBlockchainToFile = (path, blockchain) => {
    fs.writeFile(path, JSON.stringify(blockchain), function (err) {
        if (err) {
            return console.log(err);
        }

        console.log('Saved Chain to disk');
    });
};

var readBlockchainFromFile = (path) => {
    if (!fs.existsSync(path)) {
        return;
    }
    var fileContent = fs.readFileSync(path);
    var chain = JSON.parse(fileContent);
    console.log('Loaded Chain from disk');
    return chain;
};

module.exports = Blockchain;
