rem commit message comments:

rem Need to 
rem - install npm
rem - install curl
rem - install more packages
rem - curl need to use double quote in the curl parameters
rem - curl need to escape double quote in json string

rem install curl exe
rem install npm (node.js)

rem update npm 

npm i npm

rem install all missing modules

npm install express

npm install body-parser

npm install swagger-ui-express

npm install ramda

npm install elliptic

npm install es6-error

npm install statuses

npm install timeago.js

npm install fs-extra

npm install threads

npm install superagent

npm install yargs

npm install cli-color

rem starting only one node (need to cancel if start > 1 node)

node bin/naivecoin.js

rem 2018-03-11T14:13:56.779Z - info - 1: Starting node 1
rem 2018-03-11T14:13:56.782Z - info - 1: Blockchain empty, adding genesis block
rem 2018-03-11T14:13:56.793Z - info - 1: Removing transactions that are in the blockchain
rem 2018-03-11T14:13:56.842Z - info - 1: Listening http on port: 3001, to access the API documentation go to http://localhost:3001/api-docs/
rem ^C

rem cancel above and try again

node bin/naivecoin.js -p 3001 --name 1
rem 2018-03-11T14:23:08.700Z - info - 1: Starting node 1
rem 2018-03-11T14:23:08.705Z - info - 1: Removing transactions that are in the blockchain
rem 2018-03-11T14:23:08.732Z - info - 1: Listening http on port: 3001, to access the API documentation go to http://localhost:3001/api-docs/
rem 2018-03-11T14:23:33.240Z - info - 1: Sending http://localhost:3001 to peer http://localhost:3002/node/peers.
rem 2018-03-11T14:23:33.247Z - info - 1: Peer http://localhost:3002 added to connections.
rem 2018-03-11T14:23:33.248Z - info - 1: Getting latest block from: http://localhost:3002/blockchain/blocks/latest
rem 2018-03-11T14:23:33.249Z - info - 1: Getting transactions from: http://localhost:3002/blockchain/transactions
rem 2018-03-11T14:23:33.252Z - info - 1: Broadcasting
rem 2018-03-11T14:23:33.253Z - info - 1: Sending http://localhost:3002 to peer http://localhost:3002/node/peers.
rem 2018-03-11T14:23:33.261Z - info - 1: Peer http://localhost:3001 not added to connections, because I already have.
rem 2018-03-11T14:23:33.293Z - info - 1: Received blockchain is not longer than blockchain. Do nothing

node bin/naivecoin.js -p 3002 --name 2 --peers http://localhost:3001

rem 2018-03-11T14:23:33.114Z - info - 2: Starting node 2
rem 2018-03-11T14:23:33.118Z - info - 2: Blockchain empty, adding genesis block
rem 2018-03-11T14:23:33.121Z - info - 2: Removing transactions that are in the blockchain
rem 2018-03-11T14:23:33.124Z - info - 2: Sending http://localhost:3002 to peer http://localhost:3001/node/peers.
rem 2018-03-11T14:23:33.135Z - info - 2: Peer http://localhost:3001 added to connections.
rem 2018-03-11T14:23:33.136Z - info - 2: Getting latest block from: http://localhost:3001/blockchain/blocks/latest
rem 2018-03-11T14:23:33.138Z - info - 2: Getting transactions from: http://localhost:3001/blockchain/transactions
rem 2018-03-11T14:23:33.139Z - info - 2: Broadcasting
rem 2018-03-11T14:23:33.140Z - info - 2: Sending http://localhost:3001 to peer http://localhost:3001/node/peers.
rem 2018-03-11T14:23:33.164Z - info - 2: Listening http on port: 3002, to access the API documentation go to http://localhost:3002/api-docs/
rem 2018-03-11T14:23:33.263Z - info - 2: Received blockchain is not longer than blockchain. Do nothing
rem 2018-03-11T14:23:33.283Z - info - 2: Peer http://localhost:3001 not added to connections, because I already have.
rem 2018-03-11T14:23:33.291Z - info - 2: Peer http://localhost:3002 not added to connections, because I already have.

rem either browser to http://localhost:3001/api-docs/
rem or use this but curl need to use double quote in windows but then json use double quote as well; need escape (or use @file)

curl -X GET --header "Accept: application/json" "http://localhost:3001/node/peers"

rem  Create a wallet using password "t t t t t" (5 words)

 curl -X POST --header "Content-Type: application/json" -d "{ \"password\": \"t t t t t\" }" "http://localhost:3001/operator/wallets"
 rem {"id":"d9b073c341fde9cb42dbdf194c56bb23eff01343f5cf7243a785cc1843d0683d","addresses":[]}
 rem 2nd time it is now 
 rem {"id":"4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7","addresses":[]}
 
rem Create two addresses for the wallet created (replace walletId a2fb4d3f93ea3d4624243c03f507295c0c7cb5b78291a651e5575dcd03dfeeeb)
 curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/addresses"
 rem {"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"} <-- same address as the web site
 rem strange 2nd time still generate same address
 rem {"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}
 
 curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/addresses"

 rem {"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"}
 rem second address same: {"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"}
 
rem Mine a block to the address 1 so we can have some coins (strange as said above same address as the web site; not sure)
 curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
 rem {"index":1,"nonce":17,"previousHash":"2e2bb570cc7d1220ae9caf03d4c351877e49e33629eb51deea26a5f740dfae9e","timestamp":1520782372.152,"transactions":[{"id":"68fb9000d6d2feb4a0d2e605663e7d9a3371dcd1cf0d306b4b07fba03cc85908","hash":"2fb7e76d06ba31246cc6c0a4e6ab28c0e23d6d7c0f2dbf7f0053c9280ea704b5","type":"reward","data":{"inputs":[],"outputs":[{"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}],"hash":"0cbe0322e1f65a3a254b525d5b9efedb66bc3632a5e31618e5b7e0fb87b959d0"}
 
rem Create a transaction that transfer 1000000000 satoshis from address 1 to address 2
 curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
 rem {"id":"83b474cad770c1afc5cfdcadf81c99a49cbd8940dfe8aa434429bad8cc287d58","hash":"c3aebced0002ceba57478934684d44a83270b66d6c663dd55b82a8e6f0de245f","type":"regular","data":{"inputs":[{"transaction":"68fb9000d6d2feb4a0d2e605663e7d9a3371dcd1cf0d306b4b07fba03cc85908","index":0,"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"d15bf43b5bd4037a4771abdc4dd54a41d49559baa9dd816c78886a175ee41b9fa119140139f6713a7a8e2cd98f3dc87899a9ac3fe0ec306a4169e8bb4fdc1201"}],"outputs":[{"amount":1000000000,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":3999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}
 
rem Mine a new block containing that transaction
 curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
 rem {"index":2,"nonce":12,"previousHash":"0cbe0322e1f65a3a254b525d5b9efedb66bc3632a5e31618e5b7e0fb87b959d0","timestamp":1520782522.301,"transactions":[{"id":"83b474cad770c1afc5cfdcadf81c99a49cbd8940dfe8aa434429bad8cc287d58","hash":"c3aebced0002ceba57478934684d44a83270b66d6c663dd55b82a8e6f0de245f","type":"regular","data":{"inputs":[{"transaction":"68fb9000d6d2feb4a0d2e605663e7d9a3371dcd1cf0d306b4b07fba03cc85908","index":0,"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"d15bf43b5bd4037a4771abdc4dd54a41d49559baa9dd816c78886a175ee41b9fa119140139f6713a7a8e2cd98f3dc87899a9ac3fe0ec306a4169e8bb4fdc1201"}],"outputs":[{"amount":1000000000,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":3999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"a0f1d2c07c60b27b9b61458af7278330b22329a919c37077e8596bee84a097fd","hash":"4e3d864f019bcd051ee690c13dbb940438ab3f7cbc1d5e04a354d7c363e44fb5","type":"fee","data":{"inputs":[],"outputs":[{"amount":1,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"927d6d81e595d41ea309f57394bda6a0f35638b19c6b45aaf893c95838a1bdb1","hash":"ab9d7c4d9277f5cc88966bc9242ddd6b72ceb70de1eb0cdd191e9befb1cead9b","type":"reward","data":{"inputs":[],"outputs":[{"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}],"hash":"0ff9689462c5d455d8a01bb8140a0dd397f09bbee7743a91deb55fb99286c525"}
 
rem Check how many confirmations that transaction has.
 curl -X GET --header "Content-Type: application/json" "http://localhost:3001/node/transactions/c3c1e6fbff949042b065dc9e22d065a54ab826595fd8877d2be8ddb8cbb0e27f/confirmations"
 rem {"confirmations":0}
 rem {"confirmations":1}

rem Get address 1 balance
 curl -X GET --header "Content-Type: application/json" "http://localhost:3001/operator/e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c/balance"
 rem {"balance":9000000000}

rem Get address 2 balance
 curl -X GET --header "Content-Type: application/json" "http://localhost:3001/operator/c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8/balance"
 rem {"balance":1000000000}

rem Get unspent transactions for address 1
 curl -X GET --header "Content-Type: application/json" "http://localhost:3001/blockchain/transactions/unspent?address=e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"
 rem [{"transaction":"83b474cad770c1afc5cfdcadf81c99a49cbd8940dfe8aa434429bad8cc287d58","index":1,"amount":3999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"},{"transaction":"a0f1d2c07c60b27b9b61458af7278330b22329a919c37077e8596bee84a097fd","index":0,"amount":1,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"},{"transaction":"927d6d81e595d41ea309f57394bda6a0f35638b19c6b45aaf893c95838a1bdb1","index":0,"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]