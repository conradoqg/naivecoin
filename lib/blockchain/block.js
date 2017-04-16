const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');

class Block {
    toHash() {
        return CryptoUtil.hashString(this.index + this.previousHash + this.timestamp + this.data + this.nonce);
    }

    static get genesis() {
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
        R.forEachObjIndexed((value, key) => { block[key] = value; }, data);
        block.hash = block.toHash();
        return block;
    }

}

module.exports = Block;