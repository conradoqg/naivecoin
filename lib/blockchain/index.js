const Blocks = require('./blocks');
const Block = require('./block');
const Db = require('../util/db');
const R = require('ramda');

const BLOCKCHAIN_FILE = 'blockchain.json';

class Blockchain {
    constructor(dbName) {
        this.db = new Db('data/' + dbName + '/' + BLOCKCHAIN_FILE, new Blocks());
        this.blocks = this.db.read(Blocks);
        this.init();
    }

    init() {
        if (this.blocks.length == 0) {
            this.blocks.push(Block.genesis);
            this.db.write(this.blocks);
        }
    }

    getAll() {
        return this.blocks;
    }

    getByIndex(index) {
        return this.blocks.find((block) => { return block.index == index; });
    }

    getByHash(hash) {
        return this.blocks.find((block) => { return block.hash == hash; });
    }

    last() {
        return R.last(this.blocks);
    }

    mine(data) {
        const newBlock = Blockchain.generateNextBlock(data, this.last());
        this.addBlock(newBlock);
        return newBlock;
    }

    replaceChain(newBlocks) {
        if (!this.isValidChain(newBlocks) || newBlocks.length <= this.blocks.length) {
            console.log('Received blockchain invalid');
            return;
        }

        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        this.blocks = newBlocks;
        this.db.write(this.blocks);
    }

    isValidChain(blockchainToValidate) {
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(Block.genesis)) {
            return false;
        }

        for (let i = 1; i < blockchainToValidate.length; i++) {
            if (this.isValidBlock(Block.fromJson(blockchainToValidate[i]), blockchainToValidate[i - 1])) {
                return false;
            }
        }
        return true;
    }

    addBlock(newBlock) {
        if (this.isValidBlock(newBlock, this.last())) {
            this.blocks.push(newBlock);
            this.db.write(this.blocks);
        }
    }

    isValidBlock(newBlock, previousBlock) {
        const blockHash = newBlock.toHash();

        if (previousBlock.index + 1 !== newBlock.index) {
            console.debug('Invalid index');
            return false;
        } else if (previousBlock.hash !== newBlock.previousHash) {
            console.debug('Invalid previoushash');
            return false;
        } else if (blockHash !== newBlock.hash) {
            console.debug(typeof (newBlock.hash) + ' ' + typeof blockHash);
            console.debug(`Invalid hash: ${blockHash} ${newBlock.hash}`);
            return false;
        }
        return true;
    }

    static generateNextBlock(data, previousBlock) {
        // This part would prove a work and probably it would be done in another thread
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime() / 1000;
        return Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            data
        });
    }
}

module.exports = Blockchain;
