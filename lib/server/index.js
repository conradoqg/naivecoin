const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Block = require('../blockchain/block');

class HttpServer {
    constructor(port, node, blockchain, operator, miner) {
        const app = express();

        app.use(bodyParser.json());

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        app.get('/blockchain/blocks', (req, res) => {
            res.send(blockchain.getAllBlocks());
        });

        app.get('/blockchain/blocks/latest', (req, res) => {
            // TODO: Should respond 404 if there ins't a last block
            res.send(blockchain.getLastBlock());
        });

        app.post('/blockchain/blocks/latest', (req, res) => {
            // TODO: Should respond invalid if the block isn't important
            node.checkReceivedBlock(Block.fromJson(req.body));
            res.send();
        });

        app.get('/blockchain/blocks/:hash([a-zA-Z0-9]{64})', (req, res) => {            
            // TODO: Improve message
            let blockFound = blockchain.getBlockByHash(req.params.hash);
            if (blockFound != null) res.send(blockFound);
            else res.status(404).send('Not found');
        });

        app.get('/blockchain/blocks/:index', (req, res) => {
            // TODO: Improve message
            let blockFound = blockchain.getBlockByIndex(req.params.index);
            if (blockFound != null) res.send(blockFound);
            else res.status(404).send('Not found');
        });

        app.get('/operator/wallets', (req, res) => {
            res.send(operator.wallets);
        });

        app.post('/operator/wallets/new/:password', (req, res) => {
            // TODO: This ins't secure, because you can stole someone's else wallet if you use the same password.            
            let newWallet = operator.createWalletFromPassword(req.params.password);
            res.send(newWallet);
        });

        app.get('/operator/wallets/:walletId', (req, res) => {
            // TODO: Improve message
            let walletFound = operator.getWalletById(req.params.walletId);
            if (walletFound != null) res.send(walletFound);
            else res.status(404).send('Not found');
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

        app.post('/operator/wallets/:walletId/addresses/new', (req, res) => {
            try {
                let newAddress = operator.generateAddressForWallet(req.params.walletId);
                res.send(newAddress);
            } catch (exception) {
                res.send(404, exception.message);
            }
        });

        app.get('/operator/wallets/:walletId/addresses', (req, res) => {
            try {
                let addresses = operator.getAddressesForWallet(req.params.walletId);
                res.send(addresses);
            } catch (exception) {
                res.send(404, exception.message);
            }
        });

        app.get('/operator/wallets/:walletId/addresses/:addressId/balance', (req, res) => {            
            // TODO: Check what happens if there isn't a balance
            try {
                let balance = operator.getBalanceForWalletAddress(req.params.walletId, req.params.addressId);
                
                res.send(balance.toString());
            } catch (exception) {
                res.send(404, exception.message);
            }
        });

        app.post('/operator/wallets/:id/addresses/:id/transactions/new', (req, res) => {            
            // TODO: This is wrong
            try {
                let addresses = operator.getAddressesForWallet(req.params.id);
                res.send(addresses);
            } catch (exception) {
                res.send(404, exception.message);
            }
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

        app.listen(port, () => {
            console.log(`Listening http on port: ${port}`);
        });
    }
}

module.exports = HttpServer;