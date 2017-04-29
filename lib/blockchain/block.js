const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const Transactions = require('./transactions');

/*
{ // Block
    "index": 0, // (first block: 0)
    "previousHash": "0", // (hash of previous block, first block is 0) (64 bytes)
    "timestamp": 1465154705, // number of seconds since January 1, 1970
    "nonce": 0, // nonce used to identify the prove-of-work step.
    "transactions": [ // list of transactions inside the block
        { // transaction 0
            "id": "63ec3ac02f...8d5ebc6dba", // random id (64 bytes)
            "hash": "563b8aa350...3eecfbd26b", // hash taken from the contents of the transaction: sha256 (id + data) (64 bytes)
            "type": "regular", // transaction type (regular, fee, reward)
            "data": {
                "inputs": [], // list of input transactions
                "outputs": [] // list of output transactions
            }
        }
    ],
    "hash": "c4e0b8df46...199754d1ed" // hash taken from the contents of the block: sha256 (index + previousHash + timestamp + nonce + transactions) (64 bytes)
}
*/

class Block {
    toHash() {
        return CryptoUtil.hashString(this.index + this.previousHash + this.timestamp + this.data + this.nonce);
    }    

    getDifficulty() {
        // 14 is the maximum precision lenght supported by javascript
        return parseInt(this.hash.substring(0, 14), 16);
    }

    static get genesis() {
        // The genesis block is fixed
        let genesisBlock = {
            index: 0,
            previousHash: '0',
            timestamp: 1465154705,
            nonce: 0,
            transactions: [
                {
                    id: '63ec3ac02f822450039df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc6dba',
                    hash: null,
                    data: {
                        inputs: [],
                        outputs: []
                    }
                }
            ]
        };

        genesisBlock.transactions[0].hash = CryptoUtil.hashObject(genesisBlock.transactions[0].id + JSON.stringify(genesisBlock.transactions[0].data));

        return Block.fromJson(genesisBlock);
    }

    static fromJson(data) {
        let block = new Block();
        R.forEachObjIndexed((value, key) => {
            if (key == 'transactions' && value) {
                block[key] = Transactions.fromJson(value);
            } else {
                block[key] = value;
            }
        }, data);

        block.hash = block.toHash();
        return block;
    }

}

module.exports = Block;