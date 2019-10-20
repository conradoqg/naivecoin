const express = require('express')
const bodyParser = require('body-parser')
const swaggerUi = require('swagger-ui-express')
const R = require('ramda')
const path = require('path')
const swaggerDocument = require('./swagger.json')
const Block = require('../blockchain/block')
const Transaction = require('../blockchain/transaction')
const TransactionAssertionError = require('../blockchain/transactionAssertionError')
const BlockAssertionError = require('../blockchain/blockAssertionError')
const HTTPError = require('./httpError')
const ArgumentError = require('../util/argumentError')
const CryptoUtil = require('../util/cryptoUtil')
const timeago = require('timeago.js')
var shouldBeMining = 0
var isMining = 0 // For preventing the miner from activating multiple times, thus opening multiple threads and possibly causing a memory leak
var externMiner = null // Will be populated with the Miner constructor later
var externBlockchain = null // Will be populated with the Blockchain constructor later
var externMinerVars = {}
var minerBlock = null // Populated with an Object each time a new block is successfully mined by the internal miner

function toggleMining (rewardAddress, feeAddress) {
  if (shouldBeMining === 1) {
    shouldBeMining = 0
  } else shouldBeMining = 1
  externMinerVars.rewardAddress = rewardAddress
  externMinerVars.feeAddress = feeAddress
  console.log("miner: mining " + ((shouldBeMining === 1) ? 'enabled' : 'disabled (Finishing current block)'))
}

function checkMining () {
  if (shouldBeMining === 1) {
    if (isMining === 0) {
      isMining = 1
      console.log('miner: starting')
      externMiner.mine(externMinerVars.rewardAddress, externMinerVars.feeAddress)
      .then((newBlock) => {
        isMining = 0
        newBlock = Block.fromJson(newBlock)
        externBlockchain.addBlock(newBlock)
        minerBlock = newBlock
        console.log('miner: finished')
      })
      .catch((ex) => {
        if (ex instanceof BlockAssertionError && ex.message.includes('Invalid index')) console.error('miner: A new block were added before we were able to mine one')
        else console.error('miner: ' + ex.message)
      })
    }
  }
}

setInterval(checkMining, 1000)

class HttpServer {
  constructor (node, blockchain, operator, miner) {
    this.app = express()
    externMiner = miner
    externBlockchain = blockchain

    const projectWallet = (wallet) => {
      return {
        id: wallet.id,
        addresses: R.map((keyPair) => {
          return keyPair.publicKey
        }, wallet.keyPairs)
      }
    }

    this.app.use(bodyParser.json())

    this.app.set('view engine', 'pug')
    this.app.set('views', path.join(__dirname, 'views'))
    this.app.locals.formatters = {
      time: (rawTime) => {
        const timeInMS = new Date(rawTime * 1000)
        return `${timeInMS.toLocaleString()} - ${timeago().format(timeInMS)}`
      },
      hash: (hashString) => {
        return hashString !== '0' ? `${hashString.substr(0, 5)}...${hashString.substr(hashString.length - 5, 5)}` : '<empty>'
      },
      amount: (amount) => amount.toLocaleString()
    }
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

    this.app.get('/blockchain', (req, res) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        res.render('blockchain/index.pug', {
          pageTitle: 'Blockchain',
          blocks: blockchain.getAllBlocks()
        })
      } else { throw new HTTPError(400, 'Accept content not supported') }
    })

    this.app.get('/blockchain/blocks', (req, res) => {
      res.status(200).send(blockchain.getAllBlocks())
    })

    this.app.get('/blockchain/blocks/latest', (req, res) => {
      let lastBlock = blockchain.getLastBlock()
      if (lastBlock == null) throw new HTTPError(404, 'Last block not found')

      res.status(200).send(lastBlock)
    })

    this.app.put('/blockchain/blocks/latest', (req, res) => {
      let requestBlock = Block.fromJson(req.body)
      let result = node.checkReceivedBlock(requestBlock)

      if (result == null) res.status(200).send('Requesting the blockchain to check.')
      else if (result) res.status(200).send(requestBlock)
      else throw new HTTPError(409, 'Blockchain is update.')
    })

    this.app.get('/blockchain/blocks/:hash([a-zA-Z0-9]{64})', (req, res) => {
      let blockFound = blockchain.getBlockByHash(req.params.hash)
      if (blockFound === null || blockFound === undefined) throw new HTTPError(404, `Block not found with hash '${req.params.hash}'`)

      res.status(200).send(blockFound)
    })

    this.app.get('/blockchain/blocks/:index', (req, res) => {
      let blockFound = blockchain.getBlockByIndex(parseInt(req.params.index))
      if (blockFound === null || blockFound === undefined) throw new HTTPError(404, `Block not found with index '${req.params.index}'`)

      res.status(200).send(blockFound)
    })

    this.app.get('/blockchain/blocks/transactions/:transactionId([a-zA-Z0-9]{64})', (req, res) => {
      let transactionFromBlock = blockchain.getTransactionFromBlocks(req.params.transactionId)
      if (transactionFromBlock == null) throw new HTTPError(404, `Transaction '${req.params.transactionId}' not found in any block`)

      res.status(200).send(transactionFromBlock)
    })

    this.app.get('/blockchain/transactions', (req, res) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        res.render('blockchain/transactions/index.pug', {
          pageTitle: 'Unconfirmed Transactions',
          transactions: blockchain.getAllTransactions()
        })
      } else { res.status(200).send(blockchain.getAllTransactions()) }
    })

    this.app.post('/blockchain/transactions', (req, res) => {
      let requestTransaction = Transaction.fromJson(req.body)

      let transactionFromBlock = blockchain.getTransactionFromBlocks(requestTransaction.id)
      let transactionFromMempool = blockchain.getTransactionById(requestTransaction.id)

      if (transactionFromBlock !== undefined || transactionFromMempool !== undefined) throw new HTTPError(409, `Transaction '${requestTransaction.id}' already exists in the blockchain`)

      try {
        let newTransaction = blockchain.addTransaction(requestTransaction)
        res.status(201).send(newTransaction)
      } catch (ex) {
        if (ex instanceof TransactionAssertionError) throw new HTTPError(400, ex.message, requestTransaction, ex)
        else throw ex
      }
    })

    this.app.get('/blockchain/transactions/unspent', (req, res) => {
      res.status(200).send(blockchain.getUnspentTransactionsForAddress(req.query.address))
    })

    this.app.get('/operator/wallets', (req, res) => {
      let wallets = operator.getWallets()

      let projectedWallets = R.map(projectWallet, wallets)

      res.status(200).send(projectedWallets)
    })

    this.app.post('/operator/wallets', (req, res) => {
      let password = req.body.password
      if (password.length < 64) throw new HTTPError(400, 'Password must be 64 characters or more in length')

      let newWallet = operator.createWalletFromPassword(password)

      let projectedWallet = projectWallet(newWallet)

      res.status(201).send(projectedWallet)
    })

    this.app.get('/operator/wallets/:walletId', (req, res) => {
      let walletFound = operator.getWalletById(req.params.walletId)
      if (walletFound == null || walletFound === undefined) throw new HTTPError(404, `Wallet not found with id '${req.params.walletId}'`)

      let projectedWallet = projectWallet(walletFound)

      res.status(200).send(projectedWallet)
    })

    this.app.post('/operator/wallets/:walletId/transactions', (req, res) => {
      let walletId = req.params.walletId
      let password = req.headers.password

      if (password == null) throw new HTTPError(401, 'Wallet\'s password is missing.')
      let passwordHash = CryptoUtil.hash(password)

      try {
        if (!operator.checkWalletPassword(walletId, passwordHash)) throw new HTTPError(403, `Invalid password for wallet '${walletId}'`)
        if (req.body.amount < 0.00000001) throw new HTTPError(403, `Wallet '${walletId}' attempted to send a transaction under 1 satoshi`)

        let newTransaction = operator.createTransaction(walletId, req.body.fromAddress, req.body.toAddress, req.body.amount, req.body['changeAddress'] || req.body.fromAddress)

        newTransaction.check()

        let transactionCreated = blockchain.addTransaction(Transaction.fromJson(newTransaction))
        res.status(201).send(transactionCreated)
      } catch (ex) {
        if (ex instanceof ArgumentError || ex instanceof TransactionAssertionError) throw new HTTPError(400, ex.message, walletId, ex)
        else throw ex
      }
    })

    this.app.get('/operator/wallets/:walletId/addresses', (req, res) => {
      let walletId = req.params.walletId
      try {
        let addresses = operator.getAddressesForWallet(walletId)
        if (walletId.length < 64 || addresses === null || addresses === undefined || typeof addresses !== "object" || addresses.length <= 0) throw new HTTPError(400, `Wallet '${walletId}' does not exist, cannot get addresses`)
        res.status(200).send(addresses)
      } catch (ex) {
        if (ex instanceof ArgumentError) throw new HTTPError(400, ex.message, walletId, ex)
        else throw ex
      }
    })

    this.app.post('/operator/wallets/:walletId/addresses', (req, res) => {
      let walletId = req.params.walletId
      let password = req.headers.password

      if (password === null || password === undefined || password.length < 64 || walletId === null || walletId === undefined || walletId.length < 64) throw new HTTPError(401, 'Wallet\'s ID or Password is either missing or an incorrect format')
      let passwordHash = CryptoUtil.hash(password)

      try {
        if (!operator.checkWalletPassword(walletId, passwordHash)) throw new HTTPError(403, `Invalid password for wallet '${walletId}'`)

        let newAddress = operator.generateAddressForWallet(walletId)
        res.status(201).send({ address: newAddress })
      } catch (ex) {
        if (ex instanceof ArgumentError) throw new HTTPError(400, ex.message, walletId, ex)
        else throw ex
      }
    })

    this.app.get('/operator/:addressId/balance', (req, res) => {
      let addressId = req.params.addressId

      try {
        let balance = operator.getBalanceForAddress(addressId)
        res.status(200).send({ balance: balance })
      } catch (ex) {
        if (ex instanceof ArgumentError) throw new HTTPError(404, ex.message, { addressId }, ex)
        else throw ex
      }
    })

    this.app.get('/node/peers', (req, res) => {
      res.status(200).send(node.peers)
    })

    this.app.post('/node/peers', (req, res) => {
      let newPeer = node.connectToPeer(req.body)
      res.status(201).send(newPeer)
    })

    this.app.get('/node/transactions/:transactionId([a-zA-Z0-9]{64})/confirmations', (req, res) => {
      node.getConfirmations(req.params.transactionId)
        .then((confirmations) => {
          res.status(200).send({ confirmations: confirmations })
        })
    })

    // DEPRECATED
    this.app.post('/miner/mine', (req, res, next) => {
      miner.mine(req.body.rewardAddress, req.body['feeAddress'] || req.body.rewardAddress)
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)
          res.status(201).send(newBlock)
        })
        .catch((ex) => {
          if (ex instanceof BlockAssertionError && ex.message.includes('Invalid index')) next(new HTTPError(409, 'A new block were added before we were able to mine one'), null, ex)
          else next(ex)
        })
    })

    this.app.post('/miner/toggle', (req, res, next) => {
      toggleMining(req.body.rewardAddress, req.body['feeAddress'] || req.body.rewardAddress)
      res.send({success: true});
    })

    this.app.get('/miner/status', (req, res, next) => {
      res.send({lastBlock: minerBlock, mining: (isMining === 1), hashrate: parseInt(externMiner.getCurrentHashrate())})
    })

    this.app.get('/ping', (req, res, next) => {
      res.send("pong")
    })

    this.app.post('/stop', (req, res, next) => {
      res.send("stopping server...")
      setTimeout(function(){ process.exit() }, 1000)
    })

    this.app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
      if (err instanceof HTTPError) res.status(err.status)
      else res.status(500)
      res.send(err.message + (err.cause ? ' - ' + err.cause.message : ''))
    })
  }

  listen (host, port) {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, (err) => {
        if (err) reject(err)
		    let formattedHost = host
		    if (formattedHost === '::') formattedHost = 'localhost'
        console.info(`Listening http on port: ${this.server.address().port}, to access the API documentation go to http://${formattedHost}:${this.server.address().port}/api-docs/`)
        resolve(this)
      })
    })
  }

  stop () {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err)
        console.info('Closing http')
        resolve(this)
      })
    })
  }
}

module.exports = HttpServer
