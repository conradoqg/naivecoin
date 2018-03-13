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

node bin/naivecoin.js -a 192.168.1.5 -p 3001 --name 1
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

node bin/naivecoin.js -a 192.168.1.5 -p 3002 --name 2 --peers http://192.168.1.5:3001

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
 
rem ===============
rem start node 1 and 2  with ip address then now 3
rem ================

node bin/naivecoin.js -a 192.168.1.5 -p 3003 --name 3 --peers http://192.168.1.5:3001

rem 2018-03-13T02:55:21.456Z - info - 3: Starting node 3
rem 2018-03-13T02:55:21.459Z - info - 3: Blockchain empty, adding genesis block
rem 2018-03-13T02:55:21.464Z - info - 3: Removing transactions that are in the blockchain
rem 2018-03-13T02:55:21.469Z - info - 3: Sending http://localhost:3003 to peer http://localhost:3001/node/peers.
rem 2018-03-13T02:55:21.481Z - info - 3: Peer http://localhost:3001 added to connections.
rem 2018-03-13T02:55:21.482Z - info - 3: Getting latest block from: http://localhost:3001/blockchain/blocks/latest
rem 2018-03-13T02:55:21.484Z - info - 3: Getting transactions from: http://localhost:3001/blockchain/transactions
rem 2018-03-13T02:55:21.486Z - info - 3: Broadcasting
rem 2018-03-13T02:55:21.487Z - info - 3: Sending http://localhost:3001 to peer http://localhost:3001/node/peers.
rem 2018-03-13T02:55:21.513Z - info - 3: Listening http on port: 3003, to access the API documentation go to http://localhost:3003/api-docs/
rem 2018-03-13T02:55:21.531Z - info - 3: Blockchain possibly behind. We got: 0, Peer got: 2
rem 2018-03-13T02:55:21.532Z - info - 3: Querying chain from our peers
rem 2018-03-13T02:55:21.532Z - info - 3: Broadcasting
rem 2018-03-13T02:55:21.533Z - info - 3: Getting blocks from: http://localhost:3001/blockchain/blocks
rem 2018-03-13T02:55:21.555Z - info - 3: Peer http://localhost:3001 not added to connections, because I already have.
rem 2018-03-13T02:55:21.564Z - info - 3: Peer http://localhost:3003 not added to connections, because I already have.
rem 2018-03-13T02:55:21.568Z - info - 3: Sending http://localhost:3003 to peer http://localhost:3002/node/peers.
rem 2018-03-13T02:55:21.568Z - info - 3: Peer http://localhost:3002 added to connections.
rem 2018-03-13T02:55:21.568Z - info - 3: Getting latest block from: http://localhost:3002/blockchain/blocks/latest
rem 2018-03-13T02:55:21.569Z - info - 3: Getting transactions from: http://localhost:3002/blockchain/transactions
rem 2018-03-13T02:55:21.570Z - info - 3: Broadcasting
rem 2018-03-13T02:55:21.570Z - info - 3: Sending http://localhost:3002 to peer http://localhost:3001/node/peers.
rem 2018-03-13T02:55:21.570Z - info - 3: Sending http://localhost:3002 to peer http://localhost:3002/node/peers.
rem 2018-03-13T02:55:21.573Z - info - 3: Peer http://localhost:3003 not added to connections, because I already have.
rem 2018-03-13T02:55:21.574Z - info - 3: Blockchain possibly behind. We got: 0, Peer got: 2
rem 2018-03-13T02:55:21.576Z - info - 3: Received blockchain is longer than current blockchain
rem 2018-03-13T02:55:21.628Z - info - 3: Received blockchain is valid. Replacing current blockchain with received blockchain
rem 2018-03-13T02:55:21.635Z - info - 3: Block added: 0cbe0322e1f65a3a254b525d5b9efedb66bc3632a5e31618e5b7e0fb87b959d0
rem 2018-03-13T02:55:21.655Z - info - 3: Block added: 0ff9689462c5d455d8a01bb8140a0dd397f09bbee7743a91deb55fb99286c525
rem 2018-03-13T02:55:21.656Z - info - 3: Broadcasting
rem 2018-03-13T02:55:21.661Z - info - 3: Posting latest block to: http://localhost:3001/blockchain/blocks/latest
rem 2018-03-13T02:55:21.662Z - info - 3: Posting latest block to: http://localhost:3002/blockchain/blocks/latest
rem 2018-03-13T02:55:21.673Z - info - 3: Received blockchain is not longer than blockchain. Do nothing
rem 2018-03-13T02:55:21.678Z - warn - 3: Unable to post latest block to http://localhost:3001/blockchain/blocks/latest: Conflict
rem 2018-03-13T02:55:21.683Z - warn - 3: Unable to post latest block to http://localhost:3002/blockchain/blocks/latest: Conflict

rem trying this http://localhost:3001/blockchain
rem say need pug

npm install pug

rem then we have the pretty html display

rem Create a transaction that transfer 1000000 satoshis from address 1 to address 2
 curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
rem seem hang up in dos command prompt; also cannot use notepad++ to launch commnad as the path cannot be updated 
rem get an error message {curl: (23) Failed writing body (0 != 1384)
rem but doing it again ok

rem Create a transaction that transfer 900 satoshis from address 1 to address 2
 curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 900, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
rem now look at the uncomplete transaction
rem http://localhost:3001/blockchain/transactions

rem -- the log of above commands --

curl
rem curl: try 'curl --help' or 'curl --manual' for more information

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
rem {curl: (23) Failed writing body (0 != 1384)


 curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 900, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
rem {"id":"24e57ff0d3e1859dc4952c82182737ebd5532a00db80a3be502ae319d31a2ae2","hash":"64f4b33fefea966ffe945f0dab049cdb4efa075c955940ce5dfd55dcac02e2c1","type":"regular","data":{"inputs":[{"transaction":"a51fc52210f0b3aca8599a6216eb790102e047026c8264bc2984eac080e88b15","index":1,"amount":7999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"8e71c2f89492d6de727d3bd1d0a5ea9844584c46a6311650d64b4abab3c14b1e7c32896066585c50672560e6c06a8e8299b8b7f59bcac41f14b7d59ea73e090a"}],"outputs":[{"amount":900,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":7999999098,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}
curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
rem {"id":"3fdff12ae013c99fcd435c7e6a583f22b15670ca2e98f5af3b7758a58912bcd7","hash":"0be8ae37ce0fd69103079cb109c6ed80697bfe74d738ab631d45211d0f18169b","type":"regular","data":{"inputs":[{"transaction":"24e57ff0d3e1859dc4952c82182737ebd5532a00db80a3be502ae319d31a2ae2","index":1,"amount":7999999098,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"5c4e142073bdc1a2dc2fcfe564ede335f5a4edb3e1197481ab80ad93452babaef53147929835ad9bd78e13a8431d182cf2713419dcc61cd152693bedc5d07c07"}],"outputs":[{"amount":1000000000,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":6999999097,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
rem {"index":3,"nonce":2,"previousHash":"0ff9689462c5d455d8a01bb8140a0dd397f09bbee7743a91deb55fb99286c525","timestamp":1520910954.455,"transactions":[{"id":"a51fc52210f0b3aca8599a6216eb790102e047026c8264bc2984eac080e88b15","hash":"85bf64b0e685a94952e9a2b1bffb18945e179d35971174e0726b399384c9ae7c","type":"regular","data":{"inputs":[{"transaction":"83b474cad770c1afc5cfdcadf81c99a49cbd8940dfe8aa434429bad8cc287d58","index":1,"amount":3999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"ee48774140148ee2099f26b693f20fd7601a36cc417b40f73dceb0530abdf661a707fce6cbffa621d98479fe51a8cd39396bc91d0b618c9af60054a173449501"},{"transaction":"a0f1d2c07c60b27b9b61458af7278330b22329a919c37077e8596bee84a097fd","index":0,"amount":1,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"314e2a513645ca8e11954646ad3bb8d9bc1ccd6453bc164e6a9af5e1f7670b3d91af37e000e5056b095e70cde27e4c05c1c9a4e9125858ed90cf3347eecae60e"},{"transaction":"927d6d81e595d41ea309f57394bda6a0f35638b19c6b45aaf893c95838a1bdb1","index":0,"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"e53165cdbfa4bf4548a900bc88720e52ebee3b4750f8afc905e6def7242a1ce709743ea1b655b5aa07f064c43a5075fe80f81e952355e4fb25df82a3832c4702"}],"outputs":[{"amount":1000000000,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":7999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"24e57ff0d3e1859dc4952c82182737ebd5532a00db80a3be502ae319d31a2ae2","hash":"64f4b33fefea966ffe945f0dab049cdb4efa075c955940ce5dfd55dcac02e2c1","type":"regular","data":{"inputs":[{"transaction":"a51fc52210f0b3aca8599a6216eb790102e047026c8264bc2984eac080e88b15","index":1,"amount":7999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"8e71c2f89492d6de727d3bd1d0a5ea9844584c46a6311650d64b4abab3c14b1e7c32896066585c50672560e6c06a8e8299b8b7f59bcac41f14b7d59ea73e090a"}],"outputs":[{"amount":900,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":7999999098,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"0b5661b81f2315e04d322f74280005c7892852872a643b386fc48b7fe638e0a0","hash":"59c9e77f12a9d897ebdcba87eb4721078721102455521d3fcf89114ce7d3c2d9","type":"fee","data":{"inputs":[],"outputs":[{"amount":2,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"1bfe17b9216aa1800d384950d3ab6531f9c7afd02c674729fa3d4fb082a165bd","hash":"208925b51c6c5e2df131254767c5ad9ec63b451d12688c71e03bda2cf8389172","type":"reward","data":{"inputs":[],"outputs":[{"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}],"hash":"1333022a18f7669fd4122863eb0ad8d7a5cfdcf768e3d42c6adc2e8413b871d0"}
curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
rem {"index":4,"nonce":153,"previousHash":"1333022a18f7669fd4122863eb0ad8d7a5cfdcf768e3d42c6adc2e8413b871d0","timestamp":1520910978.268,"transactions":[{"id":"3fdff12ae013c99fcd435c7e6a583f22b15670ca2e98f5af3b7758a58912bcd7","hash":"0be8ae37ce0fd69103079cb109c6ed80697bfe74d738ab631d45211d0f18169b","type":"regular","data":{"inputs":[{"transaction":"24e57ff0d3e1859dc4952c82182737ebd5532a00db80a3be502ae319d31a2ae2","index":1,"amount":7999999098,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"5c4e142073bdc1a2dc2fcfe564ede335f5a4edb3e1197481ab80ad93452babaef53147929835ad9bd78e13a8431d182cf2713419dcc61cd152693bedc5d07c07"}],"outputs":[{"amount":1000000000,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":6999999097,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"b7eda022c6f2ab52d0667521394572f65e8da4ea13ef4e80d1dff70bbe73e070","hash":"b91f89dbfe3ca57e6d6ae9f0e5774e158fa147d04ce3f1a69e94678cc285509d","type":"fee","data":{"inputs":[],"outputs":[{"amount":1,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"89360abd70ee4aa20ba620e70aff8ec9c16a917b5cff671fabc4d8cebdf506f0","hash":"e1c97161f49b6af0fc441f0663193ef586e929f38d4bef7ed67153f8d0a66864","type":"reward","data":{"inputs":[],"outputs":[{"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}],"hash":"002d69d9b270bb28dc5069abedd9a2553e45e9672fba8eee47dc696d1b5e4896"}

rem ---- try to do 6 txn and given 2 txn per block, need 3 mining

curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"

curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 900, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 900, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" --header "password: t t t t t" -d "{ \"fromAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\", \"toAddress\": \"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8\", \"amount\": 1000000000, \"changeAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/operator/wallets/4cb9d752d137bb8c9f553719cf949abc515c33aa7550cdbcf7bc7722417ca4a7/transactions"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"rem {"index":3,"nonce":2,"previousHash":"0ff9689462c5d455d8a01bb8140a0dd397f09bbee7743a91deb55fb99286c525","timestamp":1520910954.455,"transactions":[{"id":"a51fc52210f0b3aca8599a6216eb790102e047026c8264bc2984eac080e88b15","hash":"85bf64b0e685a94952e9a2b1bffb18945e179d35971174e0726b399384c9ae7c","type":"regular","data":{"inputs":[{"transaction":"83b474cad770c1afc5cfdcadf81c99a49cbd8940dfe8aa434429bad8cc287d58","index":1,"amount":3999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"ee48774140148ee2099f26b693f20fd7601a36cc417b40f73dceb0530abdf661a707fce6cbffa621d98479fe51a8cd39396bc91d0b618c9af60054a173449501"},{"transaction":"a0f1d2c07c60b27b9b61458af7278330b22329a919c37077e8596bee84a097fd","index":0,"amount":1,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"314e2a513645ca8e11954646ad3bb8d9bc1ccd6453bc164e6a9af5e1f7670b3d91af37e000e5056b095e70cde27e4c05c1c9a4e9125858ed90cf3347eecae60e"},{"transaction":"927d6d81e595d41ea309f57394bda6a0f35638b19c6b45aaf893c95838a1bdb1","index":0,"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"e53165cdbfa4bf4548a900bc88720e52ebee3b4750f8afc905e6def7242a1ce709743ea1b655b5aa07f064c43a5075fe80f81e952355e4fb25df82a3832c4702"}],"outputs":[{"amount":1000000000,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":7999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"24e57ff0d3e1859dc4952c82182737ebd5532a00db80a3be502ae319d31a2ae2","hash":"64f4b33fefea966ffe945f0dab049cdb4efa075c955940ce5dfd55dcac02e2c1","type":"regular","data":{"inputs":[{"transaction":"a51fc52210f0b3aca8599a6216eb790102e047026c8264bc2984eac080e88b15","index":1,"amount":7999999999,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c","signature":"8e71c2f89492d6de727d3bd1d0a5ea9844584c46a6311650d64b4abab3c14b1e7c32896066585c50672560e6c06a8e8299b8b7f59bcac41f14b7d59ea73e090a"}],"outputs":[{"amount":900,"address":"c3c96504e432e35caa94c30034e70994663988ab80f94e4b526829c99958afa8"},{"amount":7999999098,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"0b5661b81f2315e04d322f74280005c7892852872a643b386fc48b7fe638e0a0","hash":"59c9e77f12a9d897ebdcba87eb4721078721102455521d3fcf89114ce7d3c2d9","type":"fee","data":{"inputs":[],"outputs":[{"amount":2,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}},{"id":"1bfe17b9216aa1800d384950d3ab6531f9c7afd02c674729fa3d4fb082a165bd","hash":"208925b51c6c5e2df131254767c5ad9ec63b451d12688c71e03bda2cf8389172","type":"reward","data":{"inputs":[],"outputs":[{"amount":5000000000,"address":"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c"}]}}],"hash":"1333022a18f7669fd4122863eb0ad8d7a5cfdcf768e3d42c6adc2e8413b871d0"}
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"

curl -X POST --header "Content-Type: application/json" -d "{ \"rewardAddress\": \"e155df3a1bac05f88321b73931b48b54ea4300be9d1225e0b62638f537e5544c\" }" "http://localhost:3001/miner/mine"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/blocks"
curl -X GET --header "Accept: application/json" "http://localhost:3001/blockchain/transactions"
