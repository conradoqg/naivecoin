const EventEmitter = require('events')
const R = require('ramda')
const Db = require('../util/db')
const Blocks = require('./blocks')
const Block = require('./block')
const Transactions = require('./transactions')
const TransactionAssertionError = require('./transactionAssertionError')
const BlockAssertionError = require('./blockAssertionError')
const BlockchainAssertionError = require('./blockchainAssertionError')
const Config = require('../config')

// Database settings
var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
var appdataPath = appdata.replace(/\\/g,'/') + '/Concord Core/';

const BLOCKCHAIN_FILE = 'blocks.json'
const TRANSACTIONS_FILE = 'transactions.json'

class Blockchain {
  constructor (dbName) {
    this.blocksDb = new Db(appdataPath + dbName + '/' + BLOCKCHAIN_FILE, new Blocks())
    this.transactionsDb = new Db(appdataPath + dbName + '/' + TRANSACTIONS_FILE, new Transactions())

    this.blocks = this.blocksDb.read(Blocks)
    this.transactions = this.transactionsDb.read(Transactions)

    // Some places uses the emitter to act after some data is changed
    this.emitter = new EventEmitter()
    this.init()
  }

  init () {
    // Create the genesis block if the blockchain is empty
    if (this.blocks.length === 0) {
      console.info('Blockchain empty, adding genesis block')
      this.blocks.push(Block.genesis)
      this.blocksDb.write(this.blocks)
    }

    // Remove transactions that are in the blockchain
    console.info('Removing transactions that are in the blockchain')
    R.forEach(this.removeBlockTransactionsFromTransactions.bind(this), this.blocks)
  }

  getAllBlocks () {
    return this.blocks
  }

  getBlockByIndex (index) {
    return R.find(R.propEq('index', index), this.blocks)
  }

  getBlockByHash (hash) {
    return R.find(R.propEq('hash', hash), this.blocks)
  }

  getLastBlock () {
    return R.last(this.blocks)
  }

  getDifficulty (index, refBlockchain = this.blocks, mixChains = false) {
    // Calculates the difficulty based on the index since the difficulty value increases every X blocks.
    let mixedChain = [...refBlockchain];
    if (mixChains) {
        mixedChain.splice(0, this.blocks.length);
        mixedChain = [].concat(this.blocks, mixedChain);
    }
    return Config.pow.getDifficulty((mixChains && index >= this.blocks.length) ? mixedChain : this.blocks, index)
  }

  getAllTransactions () {
    return this.transactions
  }

  getTransactionById (id) {
    return R.find(R.propEq('id', id), this.transactions)
  }

  getTransactionFromBlocks (transactionId) {
    return R.find(R.compose(R.find(R.propEq('id', transactionId)), R.prop('transactions')), this.blocks)
  }

  replaceChain (newBlockchain, reorgToBlock = null) {
    console.info("Replacing chain " + (reorgToBlock === null ? "without" : "with") + " a block reorganization")
    // It doesn't make sense to replace this blockchain by a smaller one
    if (newBlockchain.length <= this.blocks.length) {
      console.error('Blockchain shorter than the current blockchain')
      throw new BlockchainAssertionError('Blockchain shorter than the current blockchain')
    }

    // Verify if the new blockchain is correct
    this.checkChain(newBlockchain, (reorgToBlock === null ? false : true))

    // REORG ONLY:
    // Remove each of our forked blocks, saving each regular transaction
    // along the way until we hit reorgToBlock.
    let orphanTransactions = []
    if (reorgToBlock !== null) {
      for (let i=this.blocks.length - 1; this.blocks[i].index !== reorgToBlock.index; i--) {
        // Save "regular" transactions
        for (let a=0; a<this.blocks[i].transactions.length; a++) {
          if (this.blocks[i].transactions[a].type === "regular") orphanTransactions.push(this.blocks[i].transactions[a])
        }
        this.blocks.pop()
      }
    }

    // Get the blocks that diverges from our blockchain
    console.info('Received blockchain is valid. Replacing current blockchain with received blockchain')
    let newBlocks = R.takeLast(newBlockchain.length - this.blocks.length, newBlockchain)

    // Add each new block to the blockchain
    R.forEach((block) => {
      this.addBlock(block, false, (reorgToBlock === null ? false : true))
    }, newBlocks)

    // REORG ONLY:
    // Add and re-broadcast all orphaned regular transactions
    R.forEach((transaction) => {
      this.addTransaction(transaction)
    }, orphanTransactions)

    this.emitter.emit('blockchainReplaced', newBlocks)
  }

  checkChain (blockchainToValidate, reorg = false) {
    // Check if the genesis block is the same
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(Block.genesis)) {
      console.error('Genesis blocks aren\'t the same')
      throw new BlockchainAssertionError('Genesis blocks aren\'t the same')
    }

    // Compare every block to the previous one (it skips the first one, because it was verified before)
    try {
      for (let i = 1; i < blockchainToValidate.length; i++) {
        this.checkBlock(blockchainToValidate[i], blockchainToValidate[i - 1], blockchainToValidate, reorg)
      }
    } catch (ex) {
      console.error('Invalid block sequence:' + ex.stack);
      throw new BlockchainAssertionError('Invalid block sequence', null, ex)
    }
    return true
  }

  checkForForkTip (forkChain, refChain = this.blocks) {
    // Scan both chains backwards, starting at the length of the shortest chain
    let i, len = R.min(refChain.length, forkChain.length) - 1, forkTip = null
    for (i=len; i>1; i--) {
      // Search for the last matching block
      if (refChain[i].hash === forkChain[i].hash) {
        // Ensure an older block exists on both chains
        if (refChain[i + 1] && forkChain[i + 1]) {
          // Check if the hashes don't match
          if (refChain[i + 1].hash !== forkChain[i + 1].hash) {
            // Found a fork tip!
            forkTip = refChain[i]
          }
        }
      }
    }
    // If this returns null, a fork wasn't found
    return forkTip
  }

  addBlock (newBlock, emit = true, reorg = false) {
    // It only adds the block if it's valid (we need to compare to the previous one)
    if (this.checkBlock(newBlock, this.getLastBlock(), this.blocks, reorg)) {
      this.blocks.push(newBlock)

      // Every 1000 blocks, write them to disk
      if (this.blocks.length % 1000 === 0) {
        console.info("Writing " + this.blocks.length + " blocks to disk...")
        this.blocksDb.write(this.blocks)
        console.info("Blocks written succesfully.")
      }

      // After adding the block it removes the transactions of this block from the list of pending transactions
      this.removeBlockTransactionsFromTransactions(newBlock)

      console.info(`Block ${newBlock.index} added: ${newBlock.hash}`)
      console.debug(`Block ${newBlock.index} added: ${JSON.stringify(newBlock)}`)
      if (emit) this.emitter.emit('blockAdded', newBlock)

      return newBlock
    }
  }

  addBlocks (newBlocks) {
    newBlocks.forEach((block) => {
      this.addBlock(block, false)
    })
  }

  addTransaction (newTransaction, emit = true) {
    // It only adds the transaction if it's valid
    if (this.checkTransaction(newTransaction, this.blocks)) {
      this.transactions.push(newTransaction)
      this.transactionsDb.write(this.transactions)

      console.info(`Transaction added: ${newTransaction.id}`)
      console.debug(`Transaction added: ${JSON.stringify(newTransaction)}`)
      if (emit) this.emitter.emit('transactionAdded', newTransaction)

      return newTransaction
    }
  }

  removeBlockTransactionsFromTransactions (newBlock) {
    this.transactions = R.reject((transaction) => { return R.find(R.propEq('id', transaction.id), newBlock.transactions) }, this.transactions)
    this.transactionsDb.write(this.transactions)
  }

  checkBlock (newBlock, previousBlock, referenceBlockchain = this.blocks, reorg = false) {
    const blockHash = newBlock.toHash()

    if (previousBlock.index + 1 !== newBlock.index) { // Check if the block is the last one
      console.error(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`)
      throw new BlockAssertionError(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`)
    } else if (previousBlock.hash !== newBlock.previousHash) { // Check if the previous block is correct
      console.error(`Invalid previoushash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`)
      throw new BlockAssertionError(`Invalid previoushash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`)
    } else if (blockHash !== newBlock.hash) { // Check if the hash is correct
      console.error(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`)
      throw new BlockAssertionError(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`)
    } else {
      if (newBlock.getDifficulty() >= this.getDifficulty(newBlock.index, referenceBlockchain, true)) { // If the difficulty level of the proof-of-work challenge is correct
        console.error(`Invalid proof-of-work difficulty: expected '${newBlock.getDifficulty()}' to be smaller than '${this.getDifficulty(newBlock.index, referenceBlockchain, true)}'`)
        throw new BlockAssertionError(`Invalid proof-of-work difficulty: expected '${newBlock.getDifficulty()}' be smaller than '${this.getDifficulty(newBlock.index, referenceBlockchain, true)}'`)
      }
    }

    // INFO: Here it would need to check if the block follows some expectation regarding the minimal number of transactions, value or data size to avoid empty blocks being mined.

    // For each regular transaction in this block, check if it is valid
    if (newBlock.transactions > 1) {
      let i, len = newBlock.transactions.length
      for (i=0; i<len; i++) {
        this.checkTransaction(newBlock.transactions[i], referenceBlockchain, reorg)
      }
    }

    // Check if the sum of output transactions are equal the sum of input transactions + MINING_REWARD (representing the reward for the block miner)
    let sumOfInputsAmount = R.sum(R.flatten(R.map(R.compose(R.map(R.prop('amount')), R.prop('inputs'), R.prop('data')), newBlock.transactions))) + Config.MINING_REWARD

    // Check if the block is the Premine, Block #1, and expect a reward of PREMINE_REWARD (Minus the usual block reward).
    let premineTotalReward = Config.PREMINE_REWARD - Config.MINING_REWARD
    if (newBlock.index === 1) sumOfInputsAmount += premineTotalReward

    let sumOfOutputsAmount = R.sum(R.flatten(R.map(R.compose(R.map(R.prop('amount')), R.prop('outputs'), R.prop('data')), newBlock.transactions)))

    let isInputsAmountGreaterOrEqualThanOutputsAmount = R.gte(sumOfInputsAmount, sumOfOutputsAmount)
    if (!isInputsAmountGreaterOrEqualThanOutputsAmount) {
      console.error(`Invalid block balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`)
      throw new BlockAssertionError(`Invalid block balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`, { sumOfInputsAmount, sumOfOutputsAmount })
    }

    // Check if there is double spending
    let listOfTransactionIndexInputs = R.flatten(R.map(R.compose(R.map(R.compose(R.join('|'), R.props(['transaction', 'index']))), R.prop('inputs'), R.prop('data')), newBlock.transactions))
    let doubleSpendingList = R.filter((x) => x >= 2, R.map(R.length, R.groupBy(x => x)(listOfTransactionIndexInputs)))

    if (R.keys(doubleSpendingList).length) {
      console.error(`There are unspent output transactions being used more than once: unspent output transaction: '${R.keys(doubleSpendingList).join(', ')}'`)
      throw new BlockAssertionError(`There are unspent output transactions being used more than once: unspent output transaction: '${R.keys(doubleSpendingList).join(', ')}'`)
    }

    // Check if there is only 1 fee transaction and 1 reward transaction;
    let transactionsByType = R.countBy(R.prop('type'), newBlock.transactions)
    if (transactionsByType.fee && transactionsByType.fee > 1) {
      console.error(`Invalid fee transaction count: expected '1' got '${transactionsByType.fee}'`)
      throw new BlockAssertionError(`Invalid fee transaction count: expected '1' got '${transactionsByType.fee}'`)
    }

    if (transactionsByType.reward && transactionsByType.reward > 1) {
      console.error(`Invalid reward transaction count: expected '1' got '${transactionsByType.reward}'`)
      throw new BlockAssertionError(`Invalid reward transaction count: expected '1' got '${transactionsByType.reward}'`)
    }

    return true
  }

  checkTransaction (transaction, referenceBlockchain = this.blocks, reorg = false) {
    // Check the transaction
    transaction.check(transaction)

    // Verify spent inputs are less (or equal) in quantity to MAX_UTXOS
    // CONSENSUS: This takes affect past block 4,000. Previous transactions may waive this check.
    if (transaction.data.inputs > Config.MAX_UTXOS && referenceBlockchain.length > 4000) {
      console.error(`Transaction '${transaction.id}' exceeds the maximum input threshold (Attempted: ${transaction.data.inputs}, Max: ${Config.MAX_UTXOS})`)
      throw new TransactionAssertionError(`Transaction '${transaction.id}' exceeds the maximum input threshold (Attempted: ${transaction.data.inputs}, Max: ${Config.MAX_UTXOS})`, transaction)
    }

    // REORG ONLY
    // During a reorg, only basic TX validity tests are ran, unspent tests will be ignored
    // as a simple fix to reorgs causing "transaction already exists" errors. This fix will
    // be made more advanced in the future to avoid consensus vulnerabilities.
    console.info("reorg: " + reorg)
    if (reorg)
      return true

    // Verify if the transaction isn't already in the blockchain
    let isNotInBlockchain = R.all((block) => {
      return R.none(R.propEq('id', transaction.id), block.transactions)
    }, referenceBlockchain)

    if (!isNotInBlockchain) {
      console.error(`Transaction '${transaction.id}' is already in the blockchain`)
      throw new TransactionAssertionError(`Transaction '${transaction.id}' is already in the blockchain`, transaction)
    }

    // Verify if all input transactions are unspent in the blockchain
    let isInputTransactionsUnspent = R.all(R.equals(false), R.flatten(R.map((txInput) => {
      return R.map(
        R.pipe(
          R.prop('transactions'),
          R.map(R.pipe(
            R.path(['data', 'inputs']),
            R.contains({ transaction: txInput.transaction, index: txInput.index })
          ))
        ), referenceBlockchain)
    }, transaction.data.inputs)))

    if (!isInputTransactionsUnspent) {
      console.error(`Not all inputs are unspent for transaction '${transaction.id}'`)
      throw new TransactionAssertionError(`Not all inputs are unspent for transaction '${transaction.id}'`, transaction.data.inputs)
    }

    return true
  }

  getUnspentTransactionsForAddress (address) {
    const selectTxs = (transaction) => {
      let index = 0
      // Create a list of all transactions outputs found for an address (or all).
      R.forEach((txOutput) => {
        if (address && txOutput.address === address) {
          txOutputs.push({
            transaction: transaction.id,
            index: index,
            amount: txOutput.amount,
            address: txOutput.address
          })
        }
        index++
      }, transaction.data.outputs)

      // Create a list of all transactions inputs found for an address (or all).
      R.forEach((txInput) => {
        if (address && txInput.address !== address) return

        txInputs.push({
          transaction: txInput.transaction,
          index: txInput.index,
          amount: txInput.amount,
          address: txInput.address
        })
      }, transaction.data.inputs)
    }

    // Considers both transactions in block and unconfirmed transactions (enabling transaction chain)
    let txOutputs = []
    let txInputs = []
    R.forEach(R.pipe(R.prop('transactions'), R.forEach(selectTxs)), this.blocks)
    R.forEach(selectTxs, this.transactions)

    // Cross both lists and find transactions outputs without a corresponding transaction input
    let unspentTransactionOutput = []
    R.forEach((txOutput) => {
      if (!R.any((txInput) => txInput.transaction === txOutput.transaction && txInput.index === txOutput.index, txInputs)) {
        unspentTransactionOutput.push(txOutput)
      }
    }, txOutputs)

    return unspentTransactionOutput
  }
}

module.exports = Blockchain
