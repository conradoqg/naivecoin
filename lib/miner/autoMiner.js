const BlockAssertionError = require("../blockchain/blockAssertionError");
const Block = require('../blockchain/block');

class AutoMiner {
    constructor(miner, rewardAddress, blockchain) {
        this.miner = miner;
        this.rewardAddress = rewardAddress;
        this.blockchain = blockchain;

        this.mineLoop();
    }
    
    mineLoop() {
        console.info(`Mining started!`);

        this.miner.mine(this.rewardAddress, this.rewardAddress)
            .then((newBlock) => {
                newBlock = Block.fromJson(newBlock);
                this.blockchain.addBlock(newBlock);
                console.info(`Mining successful!`);

                this.mineLoop();
            })
            .catch((ex) => {
                if (ex instanceof BlockAssertionError && ex.message.includes('Invalid index')) 
                    console.warn('A new block were added before we were able to mine one');
                else
                    console.warn(`Mining failed: ${ex}`);

                this.mineLoop();
            });
    }
}

module.exports = AutoMiner;