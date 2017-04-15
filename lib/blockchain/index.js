const Blocks = require('./blocks');
const Block = require('./block');
const Transaction = require('./transaction');
const Transactions = require('./transactions');
const Db = require('../util/db');
const R = require('ramda');

const BLOCKCHAIN_FILE = 'blocks.json';
const TRANSACTIONS_FILE = 'transactions.json';

class Blockchain {
    constructor(dbName) {
        this.blocksDb = new Db('data/' + dbName + '/' + BLOCKCHAIN_FILE, new Blocks());
        this.transactionsDb = new Db('data/' + dbName + '/' + TRANSACTIONS_FILE, new Transactions());
        this.blocks = this.blocksDb.read(Blocks);
        this.transactions = this.transactionsDb.read(Transaction);
        this.init();
    }

    init() {
        if (this.blocks.length == 0) {
            this.blocks.push(Block.genesis);
            this.blocksDb.write(this.blocks);
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

    replaceChain(newBlocks) {
        if (!this.isValidChain(newBlocks) || newBlocks.length <= this.blocks.length) {
            console.log('Received blockchain invalid');
            return;
        }

        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        this.blocks = newBlocks;
        this.blocksDb.write(this.blocks);
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
            this.blocksDb.write(this.blocks);
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

    getUnspentTransactionsForAddress(address) {
        let txOutputs = [];

        for (var blockIndex = 0; blockIndex < this.blocks.length; blockIndex++) {
            let block = this.blocks[blockIndex];

            for (var txIndex = 0; txIndex < block.transactions.length; txIndex++) {
                let tx = block.transactions[txIndex];

                for (var txOIndex = 0; txOIndex < tx.outputs.length; txOIndex++) {
                    let txOutput = tx.outputs[txIndex];

                    if (txOutput.address == address) {
                        txOutputs.push({
                            transaction: tx.id,
                            index: txOIndex,
                            amount: txOutput.amount,
                            address: txOutput.address
                        });
                    }
                }
            }
        }

        let txInputs = [];
        for (blockIndex = 0; blockIndex < this.blocks.length; blockIndex++) {
            let block = this.blocks[blockIndex];

            for (txIndex = 0; txIndex < block.transactions.length; txIndex++) {
                let tx = block.transactions[txIndex];

                for (var txIIndex = 0; txIIndex < tx.inputs.length; txIIndex++) {
                    let txInput = tx.inputs[txIndex];

                    if (txInput.address == address) {
                        txInputs.push({
                            transaction: tx.id,
                            index: txOIndex,
                            amount: txInput.amount,
                            address: txInput.address
                        });
                    }
                }
            }
        }

        let unspentTransactionOutput = [];
        txOutputs.forEach((txOutput) => {
            if (!(txInputs.find((txInput) => { txInput.transaction = txOutput.transaction && txInput.index == txOutput.index; }))) {
                unspentTransactionOutput.push(txOutput);
            }
        });

        return unspentTransactionOutput;
    }
}

module.exports = Blockchain;
