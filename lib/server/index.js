const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Block = require('../blockchain/block');
const HTTPError = require('node-http-error');

class HttpServer {
    constructor(port, node, blockchain, operator, miner) {
        const app = express();

        app.use(bodyParser.json());

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        app.get('/blockchain/blocks', (req, res) => {
            res.send(blockchain.getAllBlocks());
        });

        app.get('/blockchain/blocks/latest', (req, res) => {            
            let lastBlock = blockchain.getLastBlock();
            if (lastBlock == null) throw new HTTPError(404, 'Last block not found');            

            res.send(lastBlock);
        });

        app.post('/blockchain/blocks/latest', (req, res) => {            
            node.checkReceivedBlock(Block.fromJson(req.body));
            res.send();
        });

        app.get('/blockchain/blocks/:hash([a-zA-Z0-9]{64})', (req, res) => {            
            let blockFound = blockchain.getBlockByHash(req.params.hash);
            if (blockFound == null) throw new HTTPError(404, `Block not found with hash '${req.params.hash}'`);

            res.send(blockFound);
        });

        app.get('/blockchain/blocks/:index', (req, res) => {            
            let blockFound = blockchain.getBlockByIndex(req.params.index);
            if (blockFound == null) throw new HTTPError(404, `Block not found with index '${req.params.index}'`);
            res.send(blockFound);
        });

        app.get('/operator/wallets', (req, res) => {
            res.send(operator.wallets);
        });

        app.post('/operator/wallets/new/:password', (req, res) => {
            // INFO: This isn't secure because you can steal someone's else wallet if you use the same password. Will stay like this for simplicity.
            let newWallet = operator.createWalletFromPassword(req.params.password);
            res.send(newWallet);
        });

        app.get('/operator/wallets/:walletId', (req, res) => {            
            let walletFound = operator.getWalletById(req.params.walletId);
            if (walletFound == null) throw new HTTPError(404, `Wallet not found with id '${req.params.walletId}'`);

            res.send(walletFound);
        });

        app.post('/operator/wallets/:walletId/transaction', (req, res) => {
            // TODO: This should check if the transaction was added (the blockchain and the unspent output transaction could be changed between the creation and insertion)
            // TODO: This should check the rest inputs
            // TODO: Define the correct place to add a transaction and broadcast (maybe an event emitter?)
            let newTransaction = operator.createTransaction(req.params.walletId, req.body.fromAddress, req.body.toAddress, req.body.amount, req.body.changeAddress);
            blockchain.addTransaction(newTransaction);
            console.log(`Transaction added: ${JSON.stringify(newTransaction)}`);
            node.broadcast(node.sendTransaction, newTransaction);
            res.send(newTransaction);
        });

        app.get('/operator/wallets/:walletId/addresses', (req, res) => {
            let addresses = operator.getAddressesForWallet(req.params.walletId);
            res.send(addresses);
        });

        app.post('/operator/wallets/:walletId/addresses/new', (req, res) => {
            let newAddress = operator.generateAddressForWallet(req.params.walletId);
            res.send(newAddress);
        });

        app.get('/operator/wallets/:walletId/addresses/:addressId/balance', (req, res) => {
            let balance = operator.getBalanceForWalletAddress(req.params.walletId, req.params.addressId);
            res.send(balance.toString());
        });       

        app.get('/node/peers', (req, res) => {
            res.send(node.peers);
        });

        app.post('/node/peers/new', (req, res) => {
            node.connectToPeer(req.body);
            res.send();
        });

        app.post('/miner/mine', (req, res) => {
            // TODO: This should be called on another thread.
            const newBlock = miner.mine(req.body.minerAddress);
            blockchain.addBlock(newBlock);
            console.log(`Block added: ${JSON.stringify(newBlock)}`);
            node.broadcast(node.sendLatestBlock, newBlock);
            res.send(newBlock);
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