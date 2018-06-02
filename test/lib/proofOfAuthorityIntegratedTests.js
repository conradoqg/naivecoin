require('mocha-steps');
const supertest = require('supertest');
const Config = require('../../lib/config');
const HttpServer = require('../../lib/httpServer');
const Blockchain = require('../../lib/blockchain');
const Operator = require('../../lib/operator');
const Miner = require('../../lib/miner');
const Node = require('../../lib/node');
const ProofSystem = require('../../lib/blockchain/proofSystem');
const fs = require('fs-extra');
const logLevel = (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 0);

describe('Integration Test (Proof-of-authority)', () => {
    const name1 = 'integrationTest1';

    const createNaivecoin = (name, host, port, peers, removeData = true) => {
        if (removeData) fs.removeSync('data/' + name + '/');
        Config.PROOF_SYSTEM = 'proofOfAuthority';
        const proofSystem = ProofSystem.create();
        const blockchain = new Blockchain(name, proofSystem);
        const operator = new Operator(name, blockchain);
        const miner = new Miner(blockchain, logLevel, proofSystem, false);
        const node = new Node(name, host, port, peers, Config.hash, blockchain);
        const httpServer = new HttpServer(node, blockchain, operator, miner);
        return httpServer.listen(host, port);
    };

    const walletPassword = 't t t t t';
    let context = {};

    step('start server 1', () => {
        return createNaivecoin(name1, 'localhost', 3001, [])
            .then((httpServer) => {
                context.httpServer1 = httpServer;
            });
    });

    step('create wallet', () => {
        return Promise.resolve()
            .then(() => {
                return supertest(context.httpServer1.app)
                    .post('/operator/wallets')
                    .send({ password: walletPassword })
                    .expect(201);
            }).then((res) => {
                context.walletId = res.body.id;
            });
    });

    step('create address 1', () => {
        return Promise.resolve()
            .then(() => {
                return supertest(context.httpServer1.app)
                    .post(`/operator/wallets/${context.walletId}/addresses`)
                    .set({ password: walletPassword })
                    .expect(201);
            }).then((res) => {
                context.address1 = res.body;                
            });
    });

    step('create address 2', () => {
        return Promise.resolve()
            .then(() => {
                return supertest(context.httpServer1.app)
                    .post(`/operator/wallets/${context.walletId}/addresses`)
                    .set({ password: walletPassword })
                    .expect(201);
            }).then((res) => {
                context.address2 = res.body;                
            });
    });

    step('mine an empty block using address 1', () => {
        return Promise.resolve()
            .then(() => {
                return supertest(context.httpServer1.app)
                    .post('/miner/mine')
                    .send({ rewardAddress: context.address1.id, secretKey: context.address1.secretKey, publicKey: context.address1.publicKey })
                    .expect(201);
            });
    });

    step('do not mine an empty block using address 2', () => {
        return Promise.resolve()
            .then(() => {
                return supertest(context.httpServer1.app)
                    .post('/miner/mine')
                    .send({ rewardAddress: context.address1.id, secretKey: context.address2.secretKey, publicKey: context.address2.publicKey })
                    .expect(400);
            });
    });
    
    step('stop server 1', () => {
        return Promise.resolve()
            .then(() => {
                return context.httpServer1.stop();
            })
            .then(() => {
                fs.removeSync('data/' + name1 + '/');
            });
    });
});