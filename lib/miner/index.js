const R = require('ramda');
const spawn = require('threads').spawn;
const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');
const Transaction = require('../blockchain/transaction');

class Miner {
    constructor(blockchain) {
        this.blockchain = blockchain;
    }

    mineInAnotherThread(address) {
        process.execArgv = R.reject((item) => item.includes('debug'), process.execArgv);
        const thread = spawn(function (input, done) {
            const R = require('ramda');
            const Block = require(input.__dirname + '/../blockchain/block');
            const CryptoUtil = require(input.__dirname + '/../util/cryptoUtil');
            const Transaction = require(input.__dirname + '/../blockchain/transaction');
            const Miner = require(input.__dirname);

            let address = input.address;
            let previousBlock = input.previousBlock;
            let blockchainTransactions = input.blockchainTransactions;

            done(Miner.generateNextBlock(address, previousBlock, blockchainTransactions));
        });

        return thread
            .send({ __dirname: __dirname, address: address, previousBlock: this.blockchain.getLastBlock(), blockchainTransactions: this.blockchain.transactions })
            .promise();
    }

    mine(address) {
        return Miner.generateNextBlock(address, this.blockchain.getLastBlock(), this.blockchain.transactions);
    }

    static generateNextBlock(address, previousBlock, blockchainTransactions) {
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

            feeTransaction.hash = CryptoUtil.hashObject(feeTransaction.id + JSON.stringify(feeTransaction.data));

            transactions.push(feeTransaction);
        }

        if (address != null) {
            let rewardTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: 4999999999, // satoshis format
                            address: address, // Usually here is a locking script (to check who and when this transaction output can be used), in this case it's simple the destination address 
                        }
                    ]
                }
            });

            rewardTransaction.hash = CryptoUtil.hashObject(rewardTransaction.id + JSON.stringify(rewardTransaction.data));

            transactions.push(rewardTransaction);
        }

        return Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            transactions
        });
    }
}

module.exports = Miner;