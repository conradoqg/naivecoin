const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');
const R = require('ramda');
const HTTPError = require('node-http-error');
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
        let transactions = R.defaultTo([],R.take(2, this.blockchain.transactions));

        // Confirm taht transaction ins't already in blockchain
        let notInBlockchain = R.all((transaction) => {
            return R.all((block) => {
                return R.none(R.propEq('id', transaction.id), block.transactions);
            }, this.blockchain.blocks);
        }, transactions);

        if (!notInBlockchain) throw new HTTPError(400, 'Some of the transactions are already in block chain.');

        // TODO: Check transaction inputs (if they are signed and are unspent)
        // TODO: Check transaction hash
        // TODO: Add fee transaction (1 satoshis per transaction), usually it is a fee over transaction size (not amount)

        let rewardTransaction = Transaction.fromJson({
            id: CryptoUtil.randomId(64),
            hash: null,
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