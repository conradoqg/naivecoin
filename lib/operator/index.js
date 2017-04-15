const Wallets = require('./wallets');
const Wallet = require('./wallet');
const Db = require('../util/db');
const R = require('ramda');

const OPERATOR_FILE = 'wallets.json';

class Operator {
    constructor(dbName, blockchain) {
        this.db = new Db('data/' + dbName + '/' + OPERATOR_FILE, new Wallets());
        this.wallets = this.db.read(Wallets);
        this.blockchain = blockchain;
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

    getWalletById(walletId) {
        return R.find((wallet) => { return wallet.id == walletId; }, this.wallets);
    }

    generateAddressForWallet(walletId) {
        let wallet = this.getWalletById(walletId);
        if (wallet == null) throw new Error(`Wallet not found for id '${walletId}'`);

        let address = wallet.generateAddress();
        this.db.write(this.wallets);
        return address;
    }

    getAddressesForWallet(walletId) {
        let wallet = this.getWalletById(walletId);
        if (wallet == null) throw new Error(`Wallet not found for id '${walletId}'`);

        let addresses = wallet.getAddresses();
        return addresses;
    }

    getAddressForWallet(walletId, address) {
        let wallet = this.getWalletById(walletId);
        if (wallet == null) throw new Error(`Wallet not found for id '${walletId}'`);

        let addressFound = wallet.getAddressByPublicKey(address);
        if (addressFound == null) throw new Error(`Address not found for id '${address}' for wallet ${walletId}`);

        return addressFound;
    }

    getBalanceForWalletAddress(walletId, addressId) {
        let address = this.getAddressForWallet(walletId, addressId);
        let utxo = this.blockchain.getUnspentTransactionsForAddress(address);
        return R.sum(R.map(R.prop('amount'), utxo));
    }
}

module.exports = Operator;