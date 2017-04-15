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
                    id: null,                    
                    data: {
                        inputs: [],
                        outputs: []
                    }
                }
            ]
        };

        genesisBlock.transactions[0].id = CryptoUtil.hashObject(genesisBlock.transactions);

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