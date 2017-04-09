const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

class HttpServer {
    constructor(port, p2p, blockchain) {
        const app = express();

        app.use(bodyParser.json());

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        app.get('/blocks', (req, res) => {
            res.send(blockchain.get());
        });

        app.post('/blocks/new', (req, res) => {
            const newBlock = blockchain.mine(req.body.data);
            console.log(`Block added: ${JSON.stringify(newBlock)}`);
            p2p.broadcast(p2p.sendLatestBlock, newBlock);
            res.send(newBlock);
        });

        app.get('/blocks/latest', (req, res) => {
            res.send(blockchain.last());
        });

        app.post('/blocks/latest', (req, res) => {
            p2p.checkReceivedBlock(req.body);
            res.send();
        });

        app.get('/peers', (req, res) => {
            res.send(p2p.peers);
        });

        app.post('/peers/new', (req, res) => {
            p2p.connectToPeer(req.body);
            res.send();
        });

        app.listen(port, () => {
            console.log(`Listening http on port: ${port}`);
        });
    }
}

module.exports = HttpServer;