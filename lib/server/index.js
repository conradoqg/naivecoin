const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Block = require('../blockchain/block');
const HTTPError = require('node-http-error');
const Transaction = require('../blockchain/transaction');

class HttpServer {
    constructor(port, node, blockchain, operator, miner) {
        const app = express();

        app.use(bodyParser.json());

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        app.get('/blockchain/blocks', (req, res) => {
            res.status(200).send(blockchain.getAllBlocks());
        });

        app.get('/blockchain/blocks/latest', (req, res) => {
            let lastBlock = blockchain.getLastBlock();
            if (lastBlock == null) throw new HTTPError(404, 'Last block not found');

            res.status(200).send(lastBlock);
        });

        app.put('/blockchain/blocks/latest', (req, res) => {
            // TODO: This should be split into a put in blocks and put to the latest
            let requestBlock = Block.fromJson(req.body);
            let result = node.checkReceivedBlock(requestBlock);

            if (result == null) res.status(200).send('Requesting the blockchain to check.');
            else if (result) res.status(200).send(requestBlock);
            else throw new HTTPError(409, 'Blockchain is update.');
        });

        app.get('/blockchain/blocks/:hash([a-zA-Z0-9]{64})', (req, res) => {
            let blockFound = blockchain.getBlockByHash(req.params.hash);
            if (blockFound == null) throw new HTTPError(404, `Block not found with hash '${req.params.hash}'`);

            res.status(200).send(blockFound);
        });

        app.get('/blockchain/blocks/:index', (req, res) => {
            let blockFound = blockchain.getBlockByIndex(req.params.index);
            if (blockFound == null) throw new HTTPError(404, `Block not found with index '${req.params.index}'`);
            res.status(200).send(blockFound);
        });

        app.get('/blockchain/transactions', (req, res) => {
            res.status(200).send(blockchain.getAllTransactions());
        });

        app.put('/blockchain/transactions/:id([a-zA-Z0-9]{64})', (req, res) => {
            let requestTransaction = Transaction.fromJson(req.body);
            let transactionFound = blockchain.getTransactionById(requestTransaction.id);

            if (transactionFound != null) throw new HTTPError(409, `Transaction '${requestTransaction.id}' already exists`);

            let newTransaction = blockchain.addTransaction(requestTransaction);

            // TODO: This should give the motive.
            if (newTransaction == null) throw new HTTPError(400, `Wasn't possible to create/update transaction '${requestTransaction.id}'`);

            res.status(200).send(newTransaction);
        });

        app.get('/operator/wallets', (req, res) => {
            // TODO: Should hide the addresses details
            res.status(200).send(operator.wallets);
        });

        app.post('/operator/wallets', (req, res) => {
            // INFO: This isn't secure because you can steal someone's else wallet if you use the same password. Will stay like this for now
            let newWallet = operator.createWalletFromPassword(req.body.password);
            res.status(201).send(newWallet);
        });

        app.get('/operator/wallets/:walletId', (req, res) => {
            let walletFound = operator.getWalletById(req.params.walletId);
            if (walletFound == null) throw new HTTPError(404, `Wallet not found with id '${req.params.walletId}'`);

            res.status(200).send(walletFound);
        });

        app.post('/operator/wallets/:walletId/transactions', (req, res) => {
            // TODO: This should check if the transaction was added (the blockchain and the unspent output transaction could be changed between the creation and insertion)
            // TODO: This should check the rest inputs            
            let newTransaction = operator.createTransaction(req.params.walletId, req.body.fromAddress, req.body.toAddress, req.body.amount, req.body.changeAddress);

            let transactionFound = blockchain.getTransactionById(newTransaction.id);

            if (transactionFound != null) throw new HTTPError(409, `Transaction '${newTransaction.id}' already exists`);

            let transactionCreated = blockchain.addTransaction(newTransaction);                        

            if (transactionCreated == null) throw new HTTPError(400, `Wasn't possible to create transaction '${transactionCreated.id}'`);

            res.status(201).send(transactionCreated);
        });

        app.get('/operator/wallets/:walletId/addresses', (req, res) => {
            let addresses = operator.getAddressesForWallet(req.params.walletId);
            res.status(200).send(addresses);
        });

        app.post('/operator/wallets/:walletId/addresses', (req, res) => {
            let newAddress = operator.generateAddressForWallet(req.params.walletId);
            res.status(201).send(newAddress);
        });

        app.get('/operator/wallets/:walletId/addresses/:addressId/balance', (req, res) => {
            let balance = operator.getBalanceForWalletAddress(req.params.walletId, req.params.addressId);
            res.status(200).send(balance.toString());
        });

        app.get('/node/peers', (req, res) => {
            res.status(200).send(node.peers);
        });

        app.post('/node/peers', (req, res) => {
            let newPeer = node.connectToPeer(req.body);
            res.status(201).send(newPeer);
        });

        app.post('/miner/mine', (req, res) => {
            // TODO: This should be called on another thread.
            const newBlock = miner.mine(req.body.rewardAddress);
            blockchain.addBlock(newBlock);            
            res.status(201).send(newBlock);
        });

        app.use(function (err, req, res, next) {
            if (err instanceof HTTPError) res.status(err.status);
            else res.status(500);
            res.send(err.message);
        });

        app.listen(port, () => {
            console.log(`Listening http on port: ${port}`);
        });
    }
}

module.exports = HttpServer;