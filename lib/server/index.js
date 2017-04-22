const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const R = require('ramda');
const swaggerDocument = require('./swagger.json');
const Block = require('../blockchain/block');
const HTTPError = require('./httpError');
const ArgumentError = require('../util/argumentError');
const Transaction = require('../blockchain/transaction');
const TransactionAssertionError = require('../blockchain/transactionAssertionError');

class HttpServer {
    constructor(port, node, blockchain, operator, miner) {
        const app = express();

        const projectWallet = (wallet) => {
            return {
                id: wallet.id,
                addresses: R.map((keyPair) => {
                    return keyPair.publicKey;
                }, wallet.keyPairs)
            };
        };

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

        app.post('/blockchain/transactions', (req, res) => {
            let requestTransaction = Transaction.fromJson(req.body);
            let transactionFound = blockchain.getTransactionById(requestTransaction.id);

            if (transactionFound != null) throw new HTTPError(409, `Transaction '${requestTransaction.id}' already exists`);

            try {
                let newTransaction = blockchain.addTransaction(requestTransaction);
                res.status(201).send(newTransaction);
            } catch (ex) {
                if (ex instanceof TransactionAssertionError) throw new HTTPError(400, `Wasn't possible to create/update transaction '${requestTransaction.id}'`, requestTransaction, ex);
                else throw ex;
            }
        });

        app.get('/blockchain/transactions/unspent', (req, res) => {
            res.status(200).send(blockchain.getUnspentTransactionsForAddress(req.query.address));
        });

        app.get('/operator/wallets', (req, res) => {
            let wallets = operator.getWallets();

            let projectedWallets = R.map(projectWallet, wallets);

            res.status(200).send(projectedWallets);
        });

        app.post('/operator/wallets', (req, res) => {
            // INFO: This isn't secure because you can steal someone's else wallet if you use the same password. Will stay like this for now
            let newWallet = operator.createWalletFromPassword(req.body.password);

            let projectedWallet = projectWallet(newWallet);

            res.status(201).send(projectedWallet);
        });

        app.get('/operator/wallets/:walletId', (req, res) => {
            let walletFound = operator.getWalletById(req.params.walletId);
            if (walletFound == null) throw new HTTPError(404, `Wallet not found with id '${req.params.walletId}'`);

            let projectedWallet = projectWallet(walletFound);

            res.status(200).send(projectedWallet);
        });

        app.post('/operator/wallets/:walletId/transactions', (req, res) => {
            try {
                let newTransaction = operator.createTransaction(req.params.walletId, req.body.fromAddress, req.body.toAddress, req.body.amount, req.body.changeAddress);

                newTransaction.check();

                let transactionFound = blockchain.getTransactionById(newTransaction.id);
                if (transactionFound != null) throw new HTTPError(409, `Transaction '${newTransaction.id}' already exists`);

                let transactionCreated = blockchain.addTransaction(Transaction.fromJson(newTransaction));
                res.status(201).send(transactionCreated);
            } catch (ex) {
                if (ex instanceof TransactionAssertionError) throw new HTTPError(400, 'Wasn\'t possible to create transaction', req.params, ex);
                else throw ex;
            }
        });

        app.get('/operator/wallets/:walletId/addresses', (req, res) => {
            let walletId = req.params.walletId;
            try {
                let addresses = operator.getAddressesForWallet(walletId);
                res.status(200).send(addresses);
            } catch (ex) {
                if (ex instanceof ArgumentError) throw new HTTPError(400, ex.message, walletId, ex);
                else throw ex;
            }
        });

        app.post('/operator/wallets/:walletId/addresses', (req, res) => {
            let walletId = req.params.walletId;
            try {
                let newAddress = operator.generateAddressForWallet(walletId);
                res.status(201).send(newAddress);
            } catch (ex) {
                if (ex instanceof ArgumentError) throw new HTTPError(400, ex.message, walletId, ex);
                else throw ex;
            }
        });

        app.get('/operator/wallets/:walletId/addresses/:addressId/balance', (req, res) => {
            let walletId = req.params.walletId;
            let addressId = req.params.addressId;
            try {
                let balance = operator.getBalanceForWalletAddress(walletId, addressId);
                res.status(200).send(balance.toString());
            } catch (ex) {
                if (ex instanceof ArgumentError) throw new HTTPError(400, ex.message, { walletId, addressId }, ex);
                else throw ex;
            }
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
            res.send(err.message + (err.cause ? ' - ' + err.cause.message : ''));
        });

        app.listen(port, () => {
            console.log(`Listening http on port: ${port}`);
        });
    }
}

module.exports = HttpServer;