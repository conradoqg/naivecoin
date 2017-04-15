const NodeRSA = require('node-rsa');

class CryptoRSAUtil {
    static generateKeyPair() {
        let key = new NodeRSA({ b: 512 });
        console.log(`Private key: \n${key.exportKey('pkcs1-pem-private')}`);
        console.log(`Public key: \n'${key.exportKey('pkcs1-pem-public')}`);
        return key;
    }

    static hashObject(message) {
        let messageString = JSON.stringify(message);
        let messageHash = crypto.createHash('sha256').update(messageString).digest('hex');
        console.log(`Message hash: \n${messageHash}`);
        return messageHash;
    }

    static signHash(keyPair, messageHash) {
        let signature = keyPair.sign(messageHash, 'hex');
        console.log(`Signature: \n${signature}`);
        return signature;
    }

    static verifySignature(publicKey, signature, messageHash) {
        let key = new NodeRSA({ b: 512 });
        key.importKey(publicKey, 'pkcs1-pem-public');
        let verified = key.verify(messageHash, signature, 'utf-8', 'hex');
        console.log(`Verified: ${verified}`);
        return verified;
    }
}

module.exports = CryptoRSAUtil;