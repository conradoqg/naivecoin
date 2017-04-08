const Block = require('./block');
const CryptoJS = require('crypto-js');

class Blockchain {
    constructor(repository) {
        this.repository = repository;
        this.init();
    }

    init() {
        if (!this.repository.exists()) {
            this.repository.create();
            this.repository.init();
            this.repository.push(Block.genesis);
        } else {
            this.repository.init();
        }
    }

    get() {
        return this.repository.all();
    }

    get latestBlock() {
        return this.repository.last();
    }

    mine(seed) {
        const newBlock = this.generateNextBlock(seed);
        this.addBlock(newBlock);
        return newBlock;
    }

    replaceChain(newBlocks) {
        if (!this.isValidChain(newBlocks) || newBlocks.length <= this.repository.size()) {
            console.log('Received blockchain invalid');
            return;
        }

        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        this.repository.replace(newBlocks);
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
            this.repository.push(newBlock);
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

module.exports = Blockchain;
