const superagent = require('superagent')
const Block = require('../blockchain/block')
const Blocks = require('../blockchain/blocks')
const Transactions = require('../blockchain/transactions')
const R = require('ramda')

class Node {
  constructor (host, port, peers, blockchain) {
    this.syncing = false
    this.host = host
    this.port = port
    this.peers = []
    this.blockchain = blockchain
    this.hookBlockchain()
    this.connectToPeers(peers)
  }

  /* LOCAL STATUSES (To prevent accidental overloads, spam or bandwidth maxing) */

  isSyncing () {
    return this.syncing
  }

  setSyncing (status) {
    this.syncing = status
  }

  hookBlockchain () {
    // Hook blockchain so it can broadcast blocks or transactions changes
    this.blockchain.emitter.on('blockAdded', (block) => {
      this.broadcast(this.sendLatestBlock, block)
    })

    this.blockchain.emitter.on('transactionAdded', (newTransaction) => {
      this.broadcast(this.sendTransaction, newTransaction)
    })

    this.blockchain.emitter.on('blockchainReplaced', (blocks) => {
      this.broadcast(this.sendLatestBlock, R.last(blocks))
    })
  }

  connectToPeer (newPeer) {
    this.connectToPeers([newPeer])
    return newPeer
  }

  connectToPeers (newPeers) {
    // Connect to every peer
    let formattedHost = this.host
    if (formattedHost === '::') formattedHost = 'localhost'
    let me = `http://${formattedHost}:${this.port}`
    newPeers.forEach((peer) => {
      // If it already has that peer, ignore.
      if (!this.peers.find((element) => { return element.url === peer.url }) && peer.url !== me) {
        this.sendPeer(peer, { url: me })
        console.info(`Peer ${peer.url} added to connections.`)
        this.peers.push(peer)
        this.syncWithPeer(peer)
        this.broadcast(this.sendPeer, peer)
      } else {
        console.info(`Peer ${peer.url} not added to connections, because I already have.`)
      }
    }, this)
  }

  syncWithPeer (peer) {
    // Pull blockchain & mempool transactions from our peers
    this.getLatestBlock(peer)
    this.getTransactions(peer)
  }

  sendPeer (peer, peerToSend) {
    const URL = `${peer.url}/node/peers`
    console.info(`Sending ${peerToSend.url} to peer ${URL}.`)
    return superagent
      .post(URL)
      .send(peerToSend)
      .catch((err) => {
        console.warn(`Unable to send me to peer ${URL}: ${err.message}`)
      })
  }

  getLatestBlock (peer) {
    const URL = `${peer.url}/blockchain/blocks/latest`
    let self = this
    console.info(`Getting latest block from: ${URL}`)
    return superagent
      .get(URL)
      .then((res) => {
        // Check for what to do with the latest block
        self.checkReceivedBlock(Block.fromJson(res.body))
      })
      .catch((err) => {
        console.warn(`Unable to get latest block from ${URL}: ${err.message}`)
      })
  }

  sendLatestBlock (peer, block) {
    const URL = `${peer.url}/blockchain/blocks/latest`
    console.info(`Posting latest block to: ${URL}`)
    return superagent
      .put(URL)
      .send(block)
      .catch((err) => {
        console.warn(`Unable to post latest block to ${URL}: ${err.message}`)
      })
  }

  getBlocks (peer) {
    if (this.isSyncing()) return
    this.setSyncing(true)
    const URL = `${peer.url}/blockchain/blocks`
    let self = this
    console.info(`Getting blocks from: ${URL}`)
    return superagent
      .get(URL)
      .then((res) => {
        // Check for what to do with the block list
        self.checkReceivedBlocks(Blocks.fromJson(res.body))
        this.setSyncing(false)
      })
      .catch((err) => {
        console.warn(`Unable to get blocks from ${URL}: ${err.message}`)
        this.setSyncing(false)
      })
  }

  sendTransaction (peer, transaction) {
    const URL = `${peer.url}/blockchain/transactions`
    console.info(`Sending transaction '${transaction.id}' to: '${URL}'`)
    return superagent
      .post(URL)
      .send(transaction)
      .catch((err) => {
        console.warn(`Unable to put transaction to ${URL}: ${err.message}`)
      })
  }

  getTransactions (peer) {
    const URL = `${peer.url}/blockchain/transactions`
    let self = this
    console.info(`Getting transactions from: ${URL}`)
    return superagent
      .get(URL)
      .then((res) => {
        self.syncTransactions(Transactions.fromJson(res.body))
      })
      .catch((err) => {
        console.warn(`Unable to get transations from ${URL}: ${err.message}`)
      })
  }

  getConfirmation (peer, transactionId) {
    // Get if the transaction has been confirmed in that peer
    const URL = `${peer.url}/blockchain/blocks/transactions/${transactionId}`
    console.info(`Getting transactions from: ${URL}`)
    return superagent
      .get(URL)
      .then(() => {
        return true
      })
      .catch(() => {
        return false
      })
  }

  getConfirmations (transactionId) {
    // Get from all peers if the transaction has been confirmed
    let foundLocally = this.blockchain.getTransactionFromBlocks(transactionId) != null
    return Promise.all(R.map((peer) => {
      return this.getConfirmation(peer, transactionId)
    }, this.peers))
      .then((values) => {
        return R.sum([foundLocally, ...values])
      })
  }

  broadcast (fn, ...args) {
    // Call the function for every peer connected
    console.info('Broadcasting')
    this.peers.map((peer) => {
      fn.apply(this, [peer, ...args])
    }, this)
  }

  syncTransactions (transactions) {
    // For each received transaction check if we have it, if not, add.
    R.forEach((transaction) => {
      let transactionFound = this.blockchain.getTransactionById(transaction.id)

      if (transactionFound == null) {
        console.info(`Syncing transaction '${transaction.id}'`)
        this.blockchain.addTransaction(transaction)
      }
    }, transactions)
  }

  checkReceivedBlock (block) {
    return this.checkReceivedBlocks([block])
  }

  checkReceivedBlocks (blocks) {
    const receivedBlocks = blocks.sort((b1, b2) => (b1.index - b2.index))
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1]
    const latestBlockHeld = this.blockchain.getLastBlock()
    const heightDiff = latestBlockReceived.index - latestBlockHeld.index

    // If the received blockchain is not longer than blockchain. Do nothing.
    if (latestBlockReceived.index <= latestBlockHeld.index) {
      console.info('Received blockchain is not longer than blockchain. Do nothing')
      return false
    }

    console.info(`Blockchain possibly behind. We have: ${latestBlockHeld.index}, Peer has: ${latestBlockReceived.index}`)
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) { // We can append the received block to our chain
      console.info('Appending received block to our chain')
      this.blockchain.addBlock(latestBlockReceived)
      return true
    } else if (receivedBlocks.length === 1) { // We have to query the chain from our peer
      console.info('Querying chain from our peers')
      this.broadcast(this.getBlocks)
      return null
    } else if (heightDiff >= 2 && latestBlockHeld.index !== 0) { // Only add blocks that are newer than our last block
      console.info('Scanning for fork(s) on received chain...')
      let forkTip = this.blockchain.checkForForkTip(receivedBlocks)
      if (forkTip !== null) {
        // Time for a re-org! After some validation checks
        console.info('Valid fork found, preparing local blockchain reorganization...')
        this.blockchain.replaceChain(receivedBlocks, forkTip)
        return true
      } else {
        const newBlocks = R.takeLast(heightDiff, receivedBlocks)
        console.info('No fork found, appending ' + heightDiff + ' received blocks to our chain')
        this.blockchain.addBlocks(newBlocks)
        return true
      }
    } else { // This can only be executed if our only block is the Genesis block (e.g: We have a clean installation)
      console.info('Bootstrapped blockchain from peer, importing blockchain...')
      this.blockchain.replaceChain(receivedBlocks)
      return true
    }
  }
}

module.exports = Node
