const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');
const R = require('ramda');
const Transaction = require('../blockchain/transaction');

class Miner {
    constructor(blockchain) {
        this.blockchain = blockchain;
    }

    mine(address) {
        const newBlock = this.generateNextBlock(address, this.blockchain.getLastBlock());        

        return newBlock;
    }

    generateNextBlock(address, previousBlock) {
        // This part would prove a work and probably it would be done in another thread
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime() / 1000;

        // Get the first two avaliable transactions, if there aren't 2, it's empty
        let transactions = R.defaultTo([], R.take(2, this.blockchain.transactions));

        // Add fee transaction (1 satoshi per transaction), usually it is a fee over transaction size (not amount)
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

        feeTransaction.hash = CryptoUtil.hashObject(rewardTransaction.id + JSON.stringify(rewardTransaction.data));

        transactions.push(feeTransaction);

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