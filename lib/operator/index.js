const R = require('ramda')
const Wallets = require('./wallets')
const Wallet = require('./wallet')
const Transaction = require('../blockchain/transaction')
const TransactionBuilder = require('./transactionBuilder')
const Db = require('../util/db')
const ArgumentError = require('../util/argumentError')
const Config = require('../config')

const OPERATOR_FILE = 'wallets.json'

var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
var appdataPath = appdata.replace(/\\/g,'/') + '/Concord Core/';

class Operator {
  constructor (dbName, blockchain) {
    this.db = new Db(appdataPath + dbName + '/' + OPERATOR_FILE, new Wallets())

    // INFO: In this implementation the database is a file and every time data is saved it rewrites the file, probably it should be a more robust database for performance reasons
    this.wallets = this.db.read(Wallets)
    this.blockchain = blockchain
  }

  addWallet (wallet) {
    this.wallets.push(wallet)
    this.db.write(this.wallets)
    return wallet
  }

  createWalletFromPassword (password) {
    let newWallet = Wallet.fromPassword(password)
    return this.addWallet(newWallet)
  }

  checkWalletPassword (walletId, passwordHash) {
    let wallet = this.getWalletById(walletId)
    if (wallet === null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    return wallet.passwordHash === passwordHash
  }

  getWallets () {
    return this.wallets
  }

  getWalletById (walletId) {
    return R.find((wallet) => { return wallet.id === walletId }, this.wallets)
  }

  generateAddressForWallet (walletId) {
    let wallet = this.getWalletById(walletId)
    if (wallet === null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let address = wallet.generateAddress()
    this.db.write(this.wallets)
    return address
  }

  getAddressesForWallet (walletId) {
    let wallet = this.getWalletById(walletId)
    if (wallet === null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let addresses = wallet.getAddresses()
    return addresses
  }

  getBalanceForAddress (addressId) {
    let utxo = this.blockchain.getUnspentTransactionsForAddress(addressId)

    if (utxo === null || utxo.length === 0) throw new ArgumentError(`No transactions found for address '${addressId}'`)
    return R.sum(R.map(R.prop('amount'), utxo))
  }

  createTransaction (walletId, fromAddressId, toAddressId, amount, changeAddressId) {
    let utxo = this.blockchain.getUnspentTransactionsForAddress(fromAddressId)
    let wallet = this.getWalletById(walletId)

    // Sort UTXOs by amount
    utxo.sort(function(a, b){return b.amount - a.amount})

    // Select the minimum viable UTXOs to fulfill the transaction amount,
    // larger UTXOs are made priority to minimize the data per-transaction.
    let selectedAmount = 0
    let selectedUTXOs = []
    for (let i=0; selectedAmount<=amount+Config.FEE_PER_TRANSACTION; i++) {
      console.info("Adding UTXO " + i + " worth " + utxo[i].amount + ", total amount: ")
      selectedAmount += utxo[i].amount
      selectedUTXOs.push(utxo[i])
    }

    // Reject transaction if it contains over MAX_UTXOS inputs
    if (selectedUTXOs.length > Config.MAX_UTXOS) throw new ArgumentError(`TX rejected, exceeded max inputs, please use '${Config.MAX_UTXOS}' or less. (Attempted '${selectedUTXOs.length}' UTXOs)`)

    console.info(`Selected ${selectedUTXOs.length} UTXOs for new transaction`)

    if (wallet === null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let secretKey = wallet.getSecretKeyByAddress(fromAddressId)

    if (secretKey === null) throw new ArgumentError(`Secret key not found with Wallet id '${walletId}' and address '${fromAddressId}'`)

    let tx = new TransactionBuilder()
    tx.from(selectedUTXOs)
    tx.to(toAddressId, amount)
    tx.change(changeAddressId || fromAddressId)
    tx.fee(Config.FEE_PER_TRANSACTION)
    tx.sign(secretKey)

    return Transaction.fromJson(tx.build())
  }
}

module.exports = Operator
