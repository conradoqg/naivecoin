const Wallets = require('./wallets');
const Wallet = require('./wallet');
const Db = require('../util/db');
const R = require('ramda');

const OPERATOR_FILE = 'wallets.json';

class Operator {
    constructor(dbName) {
        this.db = new Db('data/' + dbName + '/' + OPERATOR_FILE, new Wallets());
        this.wallets = this.db.read(Wallets);
    }

    addWallet(wallet) {
        this.wallets.push(wallet);
        this.db.write(this.wallets);
        return wallet;
    }

    createWalletFromPassword(password) {
        let newWallet = Wallet.fromPassword(password);
        return this.addWallet(newWallet);
    }

    createWalletFromHash(hash) {
        let newWallet = Wallet.fromHash(hash);
        return this.addWallet(newWallet);
    }

    getWalletById(id) {
        return R.find((wallet) => { return wallet.id == id; }, this.wallets);
    }

    generateAddressForWallet(id) {
        let wallet = R.find((wallet) => { return wallet.id == id; }, this.wallets);
        if (wallet == null) throw new Error(`Wallet not found for id '${id}'`);

        let address = wallet.generateAddress();
        this.db.write(this.wallets);
        return address;
    }

    getAddressesForWallet(id) {
        let wallet = R.find((wallet) => { return wallet.id == id; }, this.wallets);
        if (wallet == null) throw new Error(`Wallet not found for id '${id}'`);

        let addresses = wallet.getAddresses();
        return addresses;
    }
}

module.exports = Operator;