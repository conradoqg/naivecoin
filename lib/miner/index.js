const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');

class Miner {
    constructor(blockchain) {
        this.blockchain = blockchain;
    }

    mine(address) {
        const newBlock = Miner.generateNextBlock(address, this.blockchain.last());
        this.blockchain.addBlock(newBlock);
        return newBlock;
    }

    static generateNextBlock(address, previousBlock) {
        // This part would prove a work and probably it would be done in another thread
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime() / 1000;
        let data = [];

        // TODO: Get list of pending transactions
        // TODO: Check transaction inputs (if they are signed and unspent)
        // TODO: Check transaction hash

        let rewardTransaction = {
            in: [],
            out: [
                {
                    amount: 5000000000, // satoshis format
                    address: address, // Usually here is a locking script (to check who and when this transaction output can be used), in this case it's simple the destination address 
                }
            ]
        };

        rewardTransaction.id = CryptoUtil.hashObject(rewardTransaction);

        data.push(rewardTransaction);

        return Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            data
        });
    }
}

module.exports = Miner;