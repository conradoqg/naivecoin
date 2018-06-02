const fs = require('fs-extra');
const CryptoUtil = require('../util/cryptoUtil');

class Config {
    constructor() {
        const baseConfig = require('../../data/config');
        Object.assign(this, baseConfig);

        // If the config class is changed on runtime and this hash is made wrong, it doesn't matter because the node will reject the block/transaction and so on..
        this.hash = CryptoUtil.hash(fs.readFileSync('data/config.js'));
    }
}

module.exports = new Config();