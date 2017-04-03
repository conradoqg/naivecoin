const express = require('express');
const bodyParser = require('body-parser');

class HttpServer {
    constructor(port, p2p, blockchain) {
        const app = express();
        app.use(bodyParser.json());

        app.get('/blocks', (req, res) => {
            res.send(
                JSON.stringify(blockchain.get())
            );
        });

        app.post('/mineBlock', (req, res) => {
            const newBlock = blockchain.mine(req.body.data);
            console.log(`block added: ${JSON.stringify(newBlock)}`);
            p2p.broadcastLatest();
            res.send();
        });

        app.get('/peers', (req, res) => {
            res.send(
                p2p.sockets.map(
                    s => s._socket.remoteAddress + ':' + s._socket.remotePort
                )
            );
        });

        app.post('/addPeer', (req, res) => {
            p2p.connectToPeers([req.body.peer]);
            res.send();
        });

        app.listen(port, () => {
            console.log(`Listening http on port: ${port}`);
        });
    }
}

module.exports = HttpServer;