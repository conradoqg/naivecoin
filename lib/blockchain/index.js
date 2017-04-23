const EventEmitter = require('events');
const R = require('ramda');
const Blocks = require('./blocks');
const Block = require('./block');
const Transactions = require('./transactions');
const Db = require('../util/db');
const TransactionAssertionError = require('./transactionAssertionError');
const BlockAssertionError = require('./blockAssertionError');
const BlockchainAssertionError = require('./blockchainAssertionError');

// Database settings
const BLOCKCHAIN_FILE = 'blocks.json';
const TRANSACTIONS_FILE = 'transactions.json';

// Prove of work difficulty settings
const BASE_DIFFICULTY = Number.MAX_SAFE_INTEGER;
const EVERY_X_BLOCKS = 5;
const POW_CURVE = 5;

class Blockchain {
    constructor(dbName) {
        this.blocksDb = new Db('data/' + dbName + '/' + BLOCKCHAIN_FILE, new Blocks());
        this.transactionsDb = new Db('data/' + dbName + '/' + TRANSACTIONS_FILE, new Transactions());
        this.blocks = this.blocksDb.read(Blocks);
        this.transactions = this.transactionsDb.read(Transactions);
        this.emitter = new EventEmitter();
        this.init();
    }

    init() {
        // Create the genesis block if the blockchain is empty
        if (this.blocks.length == 0) {
            console.info('Blockchain empty, adding genesis block');
            this.blocks.push(Block.genesis);
            this.blocksDb.write(this.blocks);
        }

        console.info('Removing transactions that are in the blockchain');
        // Remove transactions that are in the chainblock
        R.forEach(this.removeBlockTransactionsFromTransactions.bind(this), this.blocks);
    }

    getAllBlocks() {
        return this.blocks;
    }

    getAllTransactions() {
        return this.transactions;
    }

    getBlockByIndex(index) {
        return R.find((block) => { return block.index == index; }, this.blocks);
    }

    getTransactionById(id) {
        return R.find((transaction) => { return transaction.id == id; }, this.transactions);
    }

    getBlockByHash(hash) {
        return R.find((block) => { return block.hash == hash; }, this.blocks);
    }

    getLastBlock() {
        return R.last(this.blocks);
    }

    getDifficulty(index) {
        return Math.max(
            Math.floor(
                BASE_DIFFICULTY / Math.pow(
                    Math.floor(((index || this.blocks.length) + 1) / EVERY_X_BLOCKS) + 1
                    , POW_CURVE)
            )
            , 0);
    }

    replaceChain(newBlockchain) {
        this.checkChain(newBlockchain);

        if (newBlockchain.length <= this.blocks.length) {
            console.error('Blockchain shorter than the current blockchain');
            throw new BlockchainAssertionError('Blockchain shorter than the current blockchain');
        }

        // Get the blocks that diverges from our blockchain
        console.info('Received blockchain is valid. Replacing current blockchain with received blockchain');
        let newBlocks = R.takeLast(newBlockchain.length - this.blocks.length, newBlockchain);

        R.forEach((block) => {
            this.addBlock(block, false);
        }, newBlocks);

        this.emitter.emit('blockchainReplaced', newBlocks);
    }

    checkChain(blockchainToValidate) {
        // Check if the genesis block is the same
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(Block.genesis)) {
            console.error('Genesis block aren\'t the same');
            throw new BlockchainAssertionError('Genesis block aren\'t the same');
        }

        // Compare each block chain to the previous one        
        try {
            for (let i = 1; i < blockchainToValidate.length; i++) {
                this.checkBlock(Block.fromJson(blockchainToValidate[i]), blockchainToValidate[i - 1]);
            }
        } catch (ex) {
            console.error('Invalid block sequence');
            throw new BlockchainAssertionError('Invalid block sequence', null, ex);
        }
        return true;
    }

    addBlock(newBlock, emit = true) {
        if (this.checkBlock(newBlock, this.getLastBlock())) {
            this.blocks.push(newBlock);
            this.removeBlockTransactionsFromTransactions(newBlock);
            this.blocksDb.write(this.blocks);
            console.info(`Block added: ${newBlock.hash}`);
            console.debug(`Block added: ${JSON.stringify(newBlock)}`);
            if (emit) this.emitter.emit('blockAdded', newBlock);
            return newBlock;
        }
    }

    addTransaction(newTransaction, emit = true) {
        if (this.checkTransaction(newTransaction)) {
            this.transactions.push(newTransaction);
            this.transactionsDb.write(this.transactions);
            console.info(`Transaction added: ${newTransaction.id}`);
            console.debug(`Transaction added: ${JSON.stringify(newTransaction)}`);
            if (emit) this.emitter.emit('transactionAdded', newTransaction);
            return newTransaction;
        }
    }

    removeBlockTransactionsFromTransactions(newBlock) {
        this.transactions = R.reject((transaction) => { return R.find(R.propEq('id', transaction.id), newBlock.transactions); }, this.transactions);
        this.transactionsDb.write(this.transactions);
    }

    checkBlock(newBlock, previousBlock) {
        const blockHash = newBlock.toHash();

        if (previousBlock.index + 1 !== newBlock.index) {
            console.error(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`);
            throw new BlockAssertionError(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`);
        } else if (previousBlock.hash !== newBlock.previousHash) {
            console.error(`Invalid previoushash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`);
            throw new BlockAssertionError(`Invalid previoushash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`);
        } else if (blockHash !== newBlock.hash) {
            console.error(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`);
            throw new BlockAssertionError(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`);
        } else if (newBlock.getDifficulty(newBlock.index) >= this.getDifficulty()) {
            console.error(`Invalid prove of work difficulty: expected '${newBlock.getDifficulty()}' to be smaller than '${this.getDifficulty()}'`);
            throw new BlockAssertionError(`Invalid prove of work difficulty: expected '${newBlock.getDifficulty()}' be smaller than '${this.getDifficulty()}'`);
        }
        return true;
    }

    checkTransaction(transaction) {
        transaction.check(transaction);

        let isNotInBlockchain = R.all((block) => {
            return R.none(R.propEq('id', transaction.id), block.transactions);
        }, this.blocks);

        if (!isNotInBlockchain) {
            console.error(`Transaction '${transaction.id}' is already in the blockchain`);
            throw new TransactionAssertionError(`Transaction '${transaction.id}' is already in the blockchain`, transaction);
        }

        let isInputTransactionsUnspent = R.all(R.equals(false), R.flatten(R.map((txInput) => {
            return R.map(
                R.pipe(
                    R.prop('transactions'),
                    R.map(R.pipe(
                        R.path(['data', 'inputs']),
                        R.contains({ transaction: txInput.transaction, index: txInput.index })
                    ))
                ), this.blocks);
        }, transaction.data.inputs)));

        if (!isInputTransactionsUnspent) {
            console.error(`Not all inputs are unspent for transaction '${transaction.id}'`);
            throw new TransactionAssertionError(`Not all inputs are unspent for transaction '${transaction.id}'`, transaction.data.inputs);
        }

        return true;
    }

    getUnspentTransactionsForAddress(address) {
        // Create a list of all transactions outputs found for an address (or all).
        let txOutputs = [];
        R.forEach(R.pipe(R.prop('transactions'), R.forEach((transaction) => {
            R.forEachObjIndexed((txOutput, index) => {
                if (address && txOutput.address != address) return;

                txOutputs.push({
                    transaction: transaction.id,
                    index: index,
                    amount: txOutput.amount,
                    address: txOutput.address
                });
            }, transaction.data.outputs);
        })), this.blocks);

        // Create a list of all transactions inputs found for an address (or all).
        let txInputs = [];
        R.forEach(R.pipe(R.prop('transactions'), R.forEach(
            R.pipe(R.path(['data', 'inputs']), R.forEach((txInput) => {
                if (address && txInput.address != address) return;

                txInputs.push({
                    transaction: txInput.transaction,
                    index: txInput.index,
                    amount: txInput.amount,
                    address: txInput.address
                });
            }))
        )), this.blocks);

        // Cross both lists and find transactions outputs without a corresponding transaction input
        let unspentTransactionOutput = [];
        R.forEach((txOutput) => {
            if (!R.contains((txInput) => { return txInput.transaction == txOutput.transaction && txInput.index == txOutput.index; }, txInputs)) {
                unspentTransactionOutput.push(txOutput);
            }
        }, txOutputs);

        return unspentTransactionOutput;
    }
}

module.exports = Blockchain;
