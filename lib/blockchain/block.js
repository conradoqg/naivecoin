const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');

class Block {
    static get genesis() {
        return Block.fromJson({
            index: 0,
            previousHash: '0',
            timestamp: 1465154705,
            data: 'let there be light.'
        });
    }

    toHash() {
        return CryptoUtil.hashString(this.index + this.previousHash + this.timestamp + this.data);
    }

    static fromJson(data) {
        let block = new Block();
        R.forEachObjIndexed((value, key) => { block[key] = value; }, data);
        block.hash = block.toHash();
        return block;
    }

}

module.exports = Block;