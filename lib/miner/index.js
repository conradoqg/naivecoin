const R = require('ramda');
const spawn = require('threads').spawn;
const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');
const Transaction = require('../blockchain/transaction');

class Miner {
    constructor(blockchain, logLevel) {
        this.blockchain = blockchain;
        this.logLevel = logLevel;
    }

    mineInAnotherThread(address) {
        process.execArgv = R.reject((item) => item.includes('debug'), process.execArgv);
        const thread = spawn(function (input, done) {
            /*eslint-disable */
            require(input.__dirname + '/../util/consoleWrapper.js')('mine-worker', this.logLevel);
            const R = require('ramda');
            const Block = require(input.__dirname + '/../blockchain/block');
            const CryptoUtil = require(input.__dirname + '/../util/cryptoUtil');
            const Transaction = require(input.__dirname + '/../blockchain/transaction');
            const Miner = require(input.__dirname);
            /*eslint-enable */

            let address = input.address;
            let blockchainSize = input.blockchainSize;
            let previousBlock = input.previousBlock;
            let blockchainTransactions = input.blockchainTransactions;

            done(Miner.generateNextBlock(address, blockchainSize, previousBlock, blockchainTransactions));
        });

        console.info('Mining a new block in another thread');
        return thread
            .send({ __dirname: __dirname, logLevel: this.logLevel, address: address, difficulty: this.blockchain.getDifficulty(), previousBlock: this.blockchain.getLastBlock(), blockchainTransactions: this.blockchain.transactions })
            .promise();
    }

    mine(address) {
        console.info('Mining a new block');
        return Miner.generateNextBlock(address, this.blockchain.getDifficulty(), this.blockchain.getLastBlock(), this.blockchain.transactions);
    }

    static generateNextBlock(address, difficulty, previousBlock, blockchainTransactions) {
        // This part would prove a work and probably it would be done in another thread
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime() / 1000;

        // Get the first two avaliable transactions, if there aren't 2, it's empty
        let transactions = R.defaultTo([], R.take(2, blockchainTransactions));

        // Add fee transaction (1 satoshi per transaction), usually it is a fee over transaction size (not amount)
        if (transactions.length > 0) {
            let feeTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: 'fee',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: transactions.length, // satoshis format
                            address: address, // Usually here is a locking script (to check who and when this transaction output can be used), in this case it's simple the destination address 
                        }
                    ]
                }
            });

            feeTransaction.hash = feeTransaction.toHash();

            transactions.push(feeTransaction);
        }

        if (address != null) {
            let rewardTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: 'award',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: 5000000000, // satoshis format
                            address: address, // Usually here is a locking script (to check who and when this transaction output can be used), in this case it's simple the destination address 
                        }
                    ]
                }
            });

            rewardTransaction.hash = rewardTransaction.toHash();

            transactions.push(rewardTransaction);
        }

        return Miner.proveWorkFor(Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            transactions
        }), difficulty);
    }

    static proveWorkFor(block, difficulty) {
        let blockDifficulty = null;
        let start = process.hrtime();
        do {
            block.timestamp = new Date().getTime() / 1000;
            block.nonce++;
            block.hash = block.toHash();
            blockDifficulty = block.getDifficulty();
        } while (blockDifficulty >= difficulty);
        console.info(`Block found: time '${process.hrtime(start)}' dif '${difficulty}' hash '${block.hash}' nonce '${block.nonce}'`);
        return block;
    }
}

module.exports = Miner;