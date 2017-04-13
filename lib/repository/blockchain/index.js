const Db = require('../../util/db');

const BLOCKCHAIN_FILE = 'blockchain.json';

class BlockchainRepository {
    constructor(dbName) {                
        this.db = new Db('data/' + dbName + '/' + BLOCKCHAIN_FILE, []);
        this.db.read();        
    }

    empty() {
        return this.db.data.length == 0;
    }    

    push(blockToPush) {
        this.db.data.push(blockToPush);
        this.db.write();        
    }

    last() {
        return this.db.data[this.db.data.length - 1];
    }

    getAll() {
        return this.db.data;
    }

    getByIndex(index) {
        return this.db.data.find((block) => { return block.index == index; });
    }

    getByHash(hash) {
        return this.db.data.find((block) => { return block.hash == hash; });
    }

    size() {
        return this.db.data.length;
    }

    replace(newBlockchain) {
        this.db.data = newBlockchain;
        this.db.write();        
    }
}

module.exports = BlockchainRepository;