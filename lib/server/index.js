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
            res.send(blockchain.getAll());
        });

        app.get('/blockchain/blocks/latest', (req, res) => {
            res.send(blockchain.last());
        });

        app.post('/blockchain/blocks/latest', (req, res) => {
            node.checkReceivedBlock(Block.fromJson(req.body));
            res.send();
        });

        app.get('/blockchain/blocks/:hash([a-zA-Z0-9]{64})', (req, res) => {
            let blockFound = blockchain.getByHash(req.params.hash);
            if (blockFound != null) res.send(blockFound);
            else res.status(404).send('Not found');
        });

        app.get('/blockchain/blocks/:index', (req, res) => {
            let blockFound = blockchain.getByIndex(req.params.index);
            if (blockFound != null) res.send(blockFound);
            else res.status(404).send('Not found');
        });

        app.get('/operator/wallets', (req, res) => {
            res.send(operator.wallets);
        });

        app.post('/operator/wallets/new/:password', (req, res) => {
            let newWallet = operator.createWalletFromPassword(req.params.password);
            res.send(newWallet);
        });

        app.get('/operator/wallets/:walletId', (req, res) => {
            let walletFound = operator.getWalletById(req.params.walletId);
            if (walletFound != null) res.send(walletFound);
            else res.status(404).send('Not found');
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
            try {
                let balance = operator.getBalanceForWalletAddress(req.params.walletId, req.params.addressId);
                
                res.send(balance.toString());
            } catch (exception) {
                res.send(404, exception.message);
            }
        });

        app.post('/operator/wallets/:id/addresses/:id/transactions/new', (req, res) => {            
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
            const newBlock = miner.mine(req.body.minerAddress);
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