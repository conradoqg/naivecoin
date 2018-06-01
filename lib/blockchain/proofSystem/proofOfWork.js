const Block = require('../block');
const Config = require('../../config');
const BlockAssertionError = require('../blockAssertionError');

class ProofOfWork {
    constructor() {
        this.type = 'proofOfWork';
    }

    buildProveData(blockchain, baseBlock) {
        return {
            baseBlock,
            difficulty: ProofOfWork.getDifficultyFromBlockchain(blockchain)
        };
    }

    // Prove data is a serialized representation of the information needed to prove something
    prove(proveData) {
        let block = Block.fromJson(proveData.baseBlock);
        let difficulty = proveData.difficulty;
        let blockDifficulty = null;
        let start = process.hrtime();

        console.debug(`Mining block proveData ${JSON.stringify(proveData)} block ${JSON.stringify(block)} for difficulty ${difficulty}`);

        // INFO: Every cryptocurrency has a different way to prove work, this is a simple hash sequence

        // Loop incrementing the nonce to find the hash at desired difficulty
        do {
            block.timestamp = new Date().getTime() / 1000;
            block.nonce++;
            block.hash = block.toHash();
            blockDifficulty = ProofOfWork.getDifficultyFromBlock(block);
        } while (blockDifficulty >= difficulty);
        console.info(`Block found: time '${process.hrtime(start)[0]} sec' dif '${difficulty}' hash '${block.hash}' nonce '${block.nonce}'`);
        return block;
    }

    assertBlock(blockchain, block) {
        let blockchainDifficulty = ProofOfWork.getDifficultyFromBlockchain(blockchain, block.index);
        let blockDifficulty = ProofOfWork.getDifficultyFromBlock(block);
        if (blockDifficulty >= blockchainDifficulty) { // If the difficulty level of the proof-of-work challenge is correct
            console.error(`Invalid proof-of-work difficulty: expected '${blockDifficulty}' to be smaller than '${blockchainDifficulty}'`);
            throw new BlockAssertionError(`Invalid proof-of-work difficulty: expected '${blockDifficulty}' to be smaller than '${blockchainDifficulty}'`);
        }
    }

    static getDifficultyFromBlock(block) {
        // 14 is the maximum precision length supported by javascript
        return parseInt(block.hash.substring(0, 14), 16);
    }

    static getDifficultyFromBlockchain(blockchain, index) {
        // Calculates the difficulty based on the index since the difficulty value increases every X blocks.
        return Config.proofOfWork.getDifficulty(blockchain.blocks, index);
    }
}

module.exports = ProofOfWork;