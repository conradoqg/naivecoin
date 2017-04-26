# Naivecoin - a cryptocurrency implementation in less than 1500 lines of code

### Motivation
Cryptocurrencies and smart-contracts on top of a blockchain aren't the most trivial concepts to understand, things like wallets, addresses, block prove-of-work, transactions, and its signatures are ease to understand when they are in a broad context. Inspired by [naivechain](https://github.com/lhartikk/naivechain), this project is an attempt to provide as concise and simple implementation of a cryptocurrency as possible.

### What is cryptocurrency
[From Wikipedia](https://en.wikipedia.org/wiki/Cryptocurrency) : A cryptocurrency (or crypto currency) is a digital asset designed to work as a medium of exchange using cryptography to secure the transactions and to control the creation of additional units of the currency.

### Key concepts of Naivecoin
* Components
    * HTTP Server
    * Node
    * Blockchain
    * Operator
    * Miner
* HTTP API interface to control everything
* Synchronization of blockchain and transactions
* Simple prove-of-work (The difficulty increases every 5 blocks)
* Addresses creation using a deterministic approach [EdDSA](https://en.wikipedia.org/wiki/EdDSA)
* Data is persisted to a folder

> Naivechain uses websocket to p2p communication, but it was dropped to simplify the understanding of message exchange. It is relying only on REST communication.

#### Components communication
```
               +---------------+
               |               |
     +------+--+  HTTP Server  +---------+
     |      |  |               |         |
     |      |  +-------+-------+         |
     |      |          |                 |
+----v----+ |  +-------v------+    +-----v------+
|         | |  |              |    |            |
|  Miner  +---->  Blockchain  <----+  Operator  |
|         | |  |              |    |            |
+---------+ |  +-------^------+    +------------+
            |          |
            |     +----+---+
            |     |        |
            +----->  Node  |
                  |        |
                  +--------+
```

#### HTTP Server
Provides an API interface to manage the blockchain, wallets, addresses, transaction creation, mining request and peer connectivity.

Bellow the endpoint list:

##### Blockchain

|Method|URL|Description|
|------|---|-----------|
|GET|/blockchain/blocks|Get all blocks|
|GET|/blockchain/blocks/{index}|Get block by index|
|GET|/blockchain/blocks/{hash}|Get block by hash|
|GET|/blockchain/blocks/latest|Get the latest block|
|PUT|/blockchain/blocks/latest|Update the latest block|
|GET|/blockchain/transactions|Get all transactions|
|POST|/blockchain/transactions|Create a transaction|
|GET|/blockchain/blocks/transactions/{transactionId}|Get a transaction from blocks|
|GET|/blockchain/transactions/unspent|Get unspent transactions|

##### Operator

|Method|URL|Description|
|------|---|-----------|
|GET|/operator/wallets|Get all wallets|
|POST|/operator/wallets|Create a wallet from a password|
|GET|/operator/wallets/{walletId}|Get wallet by id|
|POST|/operator/wallets/{walletId}/transactions|Create a new transaction|
|GET|/operator/wallets/{walletId}/addresses|Get all addresses of a wallet|
|POST|/operator/wallets/{walletId}/addresses|Create a new address|
|GET|/operator/wallets/{walletId}/addresses/{addressId}/balance|Get the balance of a given address and wallet|

##### Node

|Method|URL|Description|
|------|---|-----------|
|GET|/node/peers|Get all peers connected to node|
|POST|/node/peers|Connects a new peer to node|
|GET|/node/transactions/{transactionId}/confirmations|Get how many confirmations a block has|

##### Miner

|Method|URL|Description|
|------|---|-----------|
|POST|/miner/mine|Mine a new block|
|POST|/miner/mineInAnotherThread|Mine a new block (in another thread)|

#### Blockchain

The blockchain holds two information, the block list, and the transactions list. Its responsibility is to verify arriving blocks, transactions and to keep the blockchain coherent.

Blockchain is a sequence of correlated blocks by hash:
```
+-----------+                +-----------+                +-----------+
|           |  previousHash  |           |  previousHash  |           |
|  Block 0  <----------------+  Block 1  <----------------+  Block N  |
|           |                |           |                |           |
+-----------+                +-----------+                +-----------+
```

Transactions is a list of pending transactions (to be added to a block by a miner and then if accepted to a blockchain)
```
[
    transaction 1,
    transaction 2,
    transaction 3
]
```

##### Block structure:

```javascript
{
    "index": 0, // (first block: 0)
    "previousHash": "0", // (hash of previous block, first block is 0) (64 bytes)
    "timestamp": 1465154705,
    "nonce": 0, // nonce used to identify the prove-of-work step.
    "transactions": [ // list of transactions inside the blockchain
        {
            "id": "63ec3ac02f...8d5ebc6dba", // random id (64 bytes)
            "hash": "563b8aa350...3eecfbd26b", // hash taken from the contents of the transaction: sha256 (id + data) (64 bytes)
            "data": {
                "inputs": [], // list of input transactions
                "outputs": [] // list of output transactions
            }
        }
    ],
    "hash": "c4e0b8df46...199754d1ed" // hash taken from the contents of the block: sha256 (index + previousHash + timestamp + nonce + transactions) (64 bytes)
}
```

##### Transaction structure:
```javascript
{
    "id": "84286bba8d...7477efdae1", // random id (64 bytes)
    "hash": "f697d4ae63...c1e85f0ac3", // hash taken from the contents of the transaction: sha256 (id + data) (64 bytes)
    "data": {
        "inputs": [
            {
                "transaction": "9e765ad30c...e908b32f0c", // transaction hash taken from a previous unspent transaction output (64 bytes)
                "index": "0", // index of the transaction taken from a previous unspent transaction output
                "amount": 5000000000, // amount of satoshis
                "address": "dda3ce5aa5...b409bf3fdc", // from address (64 bytes)
                "signature": "27d911cac0...6486adbf05" // transaction input hash: sha256 (transaction + index + amount + address) signed with owner address's secret key (128 bytes)
            }
        ],
        "outputs": [
            {
                "amount": 10000, // amount of satoshis
                "address": "4f8293356d...b53e8c5b25" // to address (64 bytes)
            },
            {
                "amount": 4999989999, // amount of satoshis
                "address": "dda3ce5aa5...b409bf3fdc" // change address (64 bytes)
            }
        ]
    }
}
```

#### Operator

The operator handles wallet and addresses as well the transaction creation. Most of its operation are CRUD related.

```javascript
[
    { // Wallet
        "id": "884d3e0407...f29af094fd", // random id (64 bytes)
        "passwordHash": "5ba9151d1c...1424be8e2c", // hash taken from password: sha256 (password) (64 bytes)
        "secret": "6acb83e364...c1a04b6ee6", // pbkdf2 secret taken from password hash: sha512 (salt + passwordHash + random factor)
        "keyPairs": [
            {
                "index": 1,
                "secretKey": "6acb83e364...ee6bcdbc73", // EdDSA secret key generated from the secret (1024 bytes)
                "publicKey": "dda3ce5aa5...b409bf3fdc" // EdDSA public key generated from the secret (64 bytes) (also known as address)
            },
            {
                "index": 2,
                "secretKey": "072ab010ed...246ed16d26", // EdDSA secret key generated from pbkdf2 (sha512 (salt + passwordHash + random factor)) over last address secret key (1024 bytes)
                "publicKey": "4f8293356d...b53e8c5b25"  // EdDSA public key generated from the secret (64 bytes) (also known as address)
            }     
        ]
    }
]
```

#### Miner

Miner gets the list of unconfirmed transactions and creates a new block containing the transactions. By configuration, every blockchain has at most 2 transactions in it. 
The prove-of-work is done by calculating the 14 first hex values for a given transaction hash and increases the nonce util it reaches the minimal difficulty level required. The difficulty increases by a exponential value (power of 5) every 5 blocks created. Around the 70th block created it starts to spend around 50 seconds to generate a new block with this configuration. All these values can be tweaked.

The mining also generates 50 coins to the miner and includes a fee of 1 satoshi per transaction.

#### Node

The node contains a list of connected peers, and does all the data exchange between nodes, including:
1. Receive new peers and check what to do with it
1. Receive new blocks and check what to do with it
2. Receive new transactions and check what to do with it

The node rebroadcast every information it receives unless it doesn't do anything with it, for example if it already have the peer/transaction/blockchain.

An extra responsability is to get the amount of confirmations for a given transaction. It does that by asking every node if it has that transactions in its blockchain.

### Quick start

```sh
# Run a node
$ node bin/naivecoin.js

# Run two nodes
$ node bin/naivecoin.js -p 3001 --name 1
$ node bin/naivecoin.js -p 3002 --name 2 --peers http://localhost:3001

# Access the swagger API
http://localhost:3001/api-docs/
```

#### Docker

```sh
# Build the image
$ docker build . -t naivecoin

# Run naivecoin in a docker
$ ./dockerExec.sh

# Run naivecoin in a docker using port 3002
$ ./dockerExec.sh -p 3002

# Run naivecoin in a docker options
$ ./dockerExec.sh -h
Usage: ./dockerExec.sh -a HOST -p PORT -l LOG_LEVEL -e PEERS -n NAME

# Run docker-compose with 3 nodes
$ docker-compose up
```

### Client

```sh
# Command-line options
$ node bin/naivecoin.js -h
Usage: bin\naivecoin.js [options]

Options:
  -a, --host       Host address. (localhost by default)
  -p, --port       HTTP port. (3001 by default)
  -l, --log-level  Log level (7=dir, debug, time and trace, 6=log and info,
                   4=warn, 3=error, assert, 6 by default).
  --peers          Peers list.                                           [array]
  --name           Node name/identifier.
  -h, --help       Show help                                           [boolean]
```

### Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the Apache 2.0 license. You are also implicitly verifying that
all code is your original work.

## License

Copyright (c) 2015-2015, Conrado Quilles Gomes. (Apache 2.0 License)

See LICENSE for more info.
