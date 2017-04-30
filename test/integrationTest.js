const supertest = require('supertest');
const assert = require('assert');
const HttpServer = require('../lib/httpServer');
const Blockchain = require('../lib/blockchain');
const Operator = require('../lib/operator');
const Miner = require('../lib/miner');
const Node = require('../lib/node');
const fs = require('fs-extra');


describe('HTTP server', () => {
    it('should create wallet, address, mine, create transaction and mine again', () => {
        const name = 'integrationTest';

        fs.removeSync('data/' + name + '/');

        require('../lib/util/consoleWrapper.js')(name, 0);

        let blockchain = new Blockchain(name);
        let operator = new Operator(name, blockchain);
        let miner = new Miner(blockchain, 0);
        let node = new Node('localhost', 3001, [], blockchain);
        let httpServer = new HttpServer(node, blockchain, operator, miner);

        let context = {};
        const walletPassword = 't t t t t';

        return Promise.resolve()
            .then(() => {
                return supertest(httpServer.app)
                    .post('/operator/wallets')
                    .send({ password: walletPassword })
                    .expect(201);
            })
            .then((res) => {
                context.walletId = res.body.id;
                return supertest(httpServer.app)
                    .post(`/operator/wallets/${context.walletId}/addresses`)
                    .set({ password: walletPassword })
                    .expect(201);
            })
            .then((res) => {
                context.address1 = res.text;
                return supertest(httpServer.app)
                    .post(`/operator/wallets/${context.walletId}/addresses`)
                    .set({ password: walletPassword })
                    .expect(201);
            })
            .then((res) => {
                context.address2 = res.text;
                return supertest(httpServer.app)
                    .post(`/operator/wallets/${context.walletId}/addresses`)
                    .set({ password: walletPassword })
                    .expect(201);
            })
            .then(() => {
                return supertest(httpServer.app)
                    .post('/miner/mine')
                    .send({ rewardAddress: context.address1 })
                    .expect(201);
            })
            .then(() => {
                return supertest(httpServer.app)
                    .post(`/operator/wallets/${context.walletId}/transactions`)
                    .set({ password: walletPassword })
                    .send({
                        fromAddress: context.address1,
                        toAddress: context.address2,
                        amount: 1000000000,
                        changeAddress: context.address1
                    })
                    .expect(201);
            })
            .then((res) => {
                context.transactionId = res.body.id;
                return supertest(httpServer.app)
                    .post('/miner/mine')
                    .send({ rewardAddress: context.address1 })
                    .expect(201);
            })
            .then(() => {
                return supertest(httpServer.app)
                    .get(`/node/transactions/${context.transactionId}/confirmations`)
                    .expect(200)
                    .expect((res) => {
                        assert(res.text == 1);
                    });
            })
            .then(() => {
                return supertest(httpServer.app)
                    .get(`/operator/wallets/${context.walletId}/addresses/${context.address1}/balance`)
                    .expect(200)
                    .expect((res) => {
                        assert(res.text == 9000000000);
                    });
            })
            .then(() => {
                return supertest(httpServer.app)
                    .get(`/operator/wallets/${context.walletId}/addresses/${context.address2}/balance`)
                    .expect(200)
                    .expect((res) => {
                        assert(res.text == 1000000000);
                    });
            });
    });
});