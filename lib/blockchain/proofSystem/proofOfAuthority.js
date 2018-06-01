const Block = require('../block');
const Config = require('../../config');
const BlockAssertionError = require('../blockAssertionError');
const CryptoEdDSAUtil = require('../../util/cryptoEdDSAUtil');

class ProofOfAuthority {
    constructor() {
        this.type = 'proofOfAuthority';
        this.allowedPublicKeys = Config.proofOfAuthority.allowedPublicKeys;
    }

    buildProveData(blockchain, baseBlock, secretKey, publicKey) {
        return { baseBlock, secretKey, publicKey };
    }

    // Prove data is a serialized representation of the information needed to prove something
    prove(proveData) {
        const block = Block.fromJson(proveData.baseBlock);
        const secretKey = proveData.secretKey;
        const publicKey = proveData.publicKey;
        const start = process.hrtime();

        console.debug(`Mining block ${JSON.stringify(block)} signed by address ${publicKey}`);
        block.timestamp = new Date().getTime() / 1000;
        block.nonce = 0;
        block.hash = block.toHash();
        block.sealer = publicKey;
        block.signature = CryptoEdDSAUtil.signHash(secretKey, block.hash);
        console.info(`Block mined: time '${process.hrtime(start)[0]} sec' hash '${block.hash}' signed by address '${publicKey}'`);
        return block;
    }

    assertBlock(blockchain, block) {
        if (!this.allowedPublicKeys.includes(block.sealer)) {
            console.error(`Invalid proof-of-authority : expected sealer '${block.sealer}' to be allowed to seal the block but it wasn't found in the allowed list`);
            throw new BlockAssertionError(`Invalid proof-of-authority : expected sealer '${block.sealer}' to be allowed to seal the block but it wasn't found in the allowed list`);
        } else if (!(block.signature && block.sealer && CryptoEdDSAUtil.verifySignature(block.sealer, block.signature, block.hash))) {
            console.error(`Invalid proof-of-authority : expected sealer '${block.sealer}' using signature ${block.signature} for hash ${block.hash} to valid`);
            throw new BlockAssertionError(`Invalid proof-of-authority : expected sealer '${block.sealer}' using signature ${block.signature} for hash ${block.hash} to valid`);
        }
    }
}

module.exports = ProofOfAuthority;