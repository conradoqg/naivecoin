const Wallet = require('./wallet');
const R = require('ramda');

class Wallets extends Array {
    static fromJson(data) {
        let wallets = new Wallets();
        R.forEach((wallet) => { wallets.push(Wallet.fromJson(wallet)); }, data);
        return wallets;
    }
}

module.exports = Wallets;