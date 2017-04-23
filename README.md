# Naivecoin - a cryptocurrency implementation in less than 1500 lines of code

### Motivation
Cryptocurrencies and smart-contracts on top of a blockchain aren't the most trivial concepts to understand, things like wallets, addresses, block prove-of-work, transactions, and its signatures are ease to understand when they are in a broad context. Inspired by [naivechain](https://github.com/lhartikk/naivechain), this project is an attempt to provide as concise and simple implementation of a cryptocurrencies as possible.

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

##### Operator

|Method|URL|Description|
|------|---|-----------|
|GET|/node/peers|Get all peers connected to node|
|POST|/node/peers|Connects a new peer to node|

##### Miner

|Method|URL|Description|
|------|---|-----------|
|POST|/miner/mine|Mine a new block|
|POST|/miner/mineInAnotherThread|Mine a new block (in another thread)|

#### Node

The node contains a list of connected peers, and do all the data exchange between nodes, including:
1. Receive new peers and check what to do with it
1. Receive new blocks and check what to do with it
2. Receive new transactions and check what to do with it

The node rebroadcast every information it receives unless it doesn't do anything with it

#### Blockchain

The blockchain holds two information, the block list, and the transactions list. Its responsibility is to verify arriving blocks, transactions and to keep the blockchain coherent.

Blockchain is a sequence of correlated blocks by hash
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
    "previousHash": "0", // (id of the previous hash, first block is 0)
    "timestamp": 1465154705,
    "nonce": 0, // nonce used to identify the prove-of-work step.
    "transactions": [ // list of transactions inside the blockchain
        {
            "id": "63ec3ac02f822450039df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc6dba", // random id
            "hash": "563b8aa3501448eeca29de9c6cf9f080a3cb3985c14f642be7b49a3eecfbd26b", // hash taken from the contents of the transaction: sha256 (id + data)
            "data": {
                "inputs": [], // list of input transactions
                "outputs": [] // list of output transactions
            }
        }
    ],
    "hash": "c4e0b8df46ce5cb2bcb0379ab0840228536cf4cd489783532a7c9d199754d1ed" // hash taken from the contents of the block: sha256 (index + previousHash + timestamp + nonce + transactions)
}
```

##### Transaction structure:
```javascript
{
    "id": "84286bba8da2571582b42707d84f19fbf94e21e13fc2eebb6135fb7477efdae1", // random id
    "hash": "f697d4ae63bc49f4c85a05e066d67df86de8332db8700f801b6fb0c1e85f0ac3", // hash taken from the contents of the transaction: sha256 (id + data)
    "data": {
        "inputs": [
            {
                "transaction": "9e765ad30cbc2f611aa9b29e37a88a25d54c78926ec2f5a8927286e908b32f0c", // transaction hash taken from a previous unspent transaction output
                "index": "0", // index of the transaction taken from a previous unspent transaction output
                "amount": 5000000000, // amount of sathosis
                "address": "dda3ce5aa50028c787664ed16b3d459373123f3e711b70e19196b4b409bf3fdc", // from address
                "signature": "27d911cac0c38449092250509c053c953a24aed258b0a53de3bf93727223195825f3dd3c176beff1c7f276420ef7964213c0e031a935ad0c1613fc6486adbf05" // transaction input hash: sha256 (transaction + index + amount + address) signed with owner address's secret key
            }
        ],
        "outputs": [
            {
                "amount": 10000, // amount of sathosis
                "address": "4f8293356d7472365d313faa607b6b1a1a9404285d0a62db9ec7acb53e8c5b25" // to address
            },
            {
                "amount": 4999989999, // amount of sathosis
                "address": "dda3ce5aa50028c787664ed16b3d459373123f3e711b70e19196b4b409bf3fdc" // change address
            }
        ]
    }
}
```

#### Operator

<todo>

### Quick start

<instructions of how to run a node>
<instructions of how to run two nodes>
<how to access the swagger API>

#### Docker

<instructions of how to run three nodes>

### Client

<show client options>

### Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the Apache 2.0 license. You are also implicitly verifying that
all code is your original work.

## License

Copyright (c) 2015-2015, Conrado Quilles Gomes. (Apache 2.0 License)

See LICENSE for more info.
