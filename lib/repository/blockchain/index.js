const fs = require('fs-extra');
const path = require('path');

const BLOCKCHAIN_FILE = 'blockchain.json';

class BlockchainRepository {
    constructor(dbName) {
        this.dbName = dbName;
        this.path = 'data/' + dbName + '/' + BLOCKCHAIN_FILE;
        this.blockchainCache = null;
    }

    exists() {
        return fs.existsSync(this.path);
    }

    create() {
        fs.ensureDirSync(path.dirname(this.path));
    }

    init() {
        this.blockchainCache = readBlockchainFromFile(this.path) || [];
    }

    push(blockToPush) {
        this.blockchainCache.push(blockToPush);
        writeBlockchainToFile(this.path, this.blockchainCache);
    }

    last() {
        return this.blockchainCache[this.blockchainCache.length - 1];
    }

    getAll() {
        return this.blockchainCache;
    }

    getByIndex(index) {
        return this.blockchainCache.find((block) => { return block.index == index; });
    }

    getByHash(hash) {
        return this.blockchainCache.find((block) => { return block.hash == hash; });
    }

    size() {
        return this.blockchainCache.length;
    }

    replace(newBlockchain) {
        this.blockchainCache = newBlockchain;
        writeBlockchainToFile(this.path, this.blockchainCache);
    }
}

var writeBlockchainToFile = (filePath, blockchain) => {
    fs.writeFile(filePath, JSON.stringify(blockchain), function (err) {
        if (err) {
            return console.log(err);
        }

        console.log('Saved Chain to disk');
    });
};

var readBlockchainFromFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;

    var fileContent = fs.readFileSync(filePath);
    if (fileContent.length == 0) return;

    var chain = JSON.parse(fileContent);
    console.log('Loaded Chain from disk');
    return chain;
};

module.exports = BlockchainRepository;