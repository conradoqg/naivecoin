const BlockAssertionError = require("../blockchain/blockAssertionError");
const Block = require('../blockchain/block');

const WAIT_SECONDS_FOR_AUTO_MINING = 30;

class AutoMiner {
    constructor(miner, rewardAddress, blockchain) {
        this.miner = miner;
        this.rewardAddress = rewardAddress;
        this.blockchain = blockchain;
        this.startedMining = false;
        this.lastBlockchainChange = 0;

        this.blockchain.emitter.on('blockchainReplaced', this.onBlockchainChange);
        this.blockchain.emitter.on('blockAdded', this.onBlockchainChange)

        this._waitForFetch(WAIT_SECONDS_FOR_AUTO_MINING, new Date().getTime() / 1000);
    }

    _waitForFetch(seconds, startTime) {
        setTimeout(() => {
            if (seconds % 10 === 0) {
                console.info(`Going to start mining if no change, ${seconds} sec left...`);
            }

            seconds --;
            
            if (this.lastBlockchainChange > startTime) { // If we found a new block, start 30 sec cooldown again
                this._waitForFetch(WAIT_SECONDS_FOR_AUTO_MINING, new Date().getTime() / 1000);
            } else if (seconds <= 0) { // If we waited and still no change, start mining
                this.startMining();
            } else { 
                this._waitForFetch(seconds, startTime);
            }
        }, 1000);
    }

    onBlockchainChange() {
        if (this.startedMining) {
            this.stopMining();
            this.startMining();
        }

        this.lastBlockchainChange = new Date().getTime() / 1000;
    }

    stopMining() {
        console.info("Stopped mining.");
        this.currentMiner.thread.kill();
    }
    
    startMining() {
        console.info(`Mining started.`);
        this.startedMining = true;

        this.currentMiner = this.miner.mine(this.rewardAddress, this.rewardAddress);

        this.currentMiner.promise.then((newBlock) => {
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