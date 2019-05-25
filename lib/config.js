// Do not change these configurations after the blockchain is initialized
module.exports = {
    // INFO: The mining reward could decrease over time like bitcoin. See https://en.bitcoin.it/wiki/Mining#Reward.
    MINING_REWARD: 1,
    // The Premine amount on block #1, can only be mined once by the Concord Developers, in this case.
    PREMINE_REWARD: 1000000,
    // INFO: Usually it's a fee over transaction size (not quantity)
    FEE_PER_TRANSACTION: 1,
    // INFO: Usually the limit is determined by block size (not quantity)
    TRANSACTIONS_PER_BLOCK: 1000,
    genesisBlock: {
        index: 0,
        previousHash: '0',
        timestamp: 1465154706,
        nonce: 0,
        transactions: [
            {
                id: '63ec3ac02f822450039df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc6dba',
                hash: null,
                type: 'regular',
                data: {
                    inputs: [],
                    outputs: []
                }
            }
        ]
    },
    pow: {
        getDifficulty: (blocks, index) => {
            // Proof-of-work difficulty settings
            const BASE_DIFFICULTY = Number.MAX_SAFE_INTEGER;
            const EVERY_X_BLOCKS = 50;
            const POW_CURVE = 5;
            const EVERY_X_SECONDS = 30;
            const AVERAGE_X_BLOCKS = 5;
            const BASE_DIFFICULTY_STEP = 1000; //This number is the number by which the difficulty is stepped in order to adjust to reach perfect block mining times
            index = (index || blocks.length);
            // INFO: The difficulty is the formula that concord uses to check the proof of work, this number is later converted to base 16 to represent the minimal initial hash expected value.
            // INFO: This could be a formula based on time. EG: Check how long it took to mine X blocks over a period of time and then decrease/increase the difficulty based on that. See https://en.bitcoin.it/wiki/Difficulty

            if (index > 2 * AVERAGE_X_BLOCKS) {
                let offset = (index - 1) % AVERAGE_X_BLOCKS;
                let avg_start_index = index - offset - AVERAGE_X_BLOCKS - 1;
                let avg_stop_index = index - offset - 1;
                let time_avg = (blocks[avg_stop_index].timestamp - blocks[avg_start_index].timestamp) / AVERAGE_X_BLOCKS;
                console.log("time_avg: " + time_avg);
                console.log("start block timestamp - BlockIndex" + blocks[avg_start_index].timestamp + " - " + avg_start_index);
                console.log("stop block timestamp - BlockIndex" + blocks[avg_stop_index].timestamp + " - " + avg_stop_index);
                let scale_factor = time_avg / EVERY_X_SECONDS;
                console.log("scale_factor: " + scale_factor);
                //let difficulty_step = BASE_DIFFICULTY_STEP * (1 / scale_factor);
                //console.log("difficulty_step: " + difficulty_step);
                let new_difficulty = Math.min(Math.max(Math.floor(parseInt(blocks[avg_stop_index].hash.substring(0, 14), 16) * (scale_factor)), 0), BASE_DIFFICULTY);
                console.log("new_difficulty: " + new_difficulty);
                return new_difficulty;
            }
            return Math.max(
                Math.floor(
                    BASE_DIFFICULTY / Math.pow(
                    Math.floor(((index || blocks.length) + 1) / EVERY_X_BLOCKS) + 1
                    , POW_CURVE)
                )
                , 0);

            /*if ((index || blocks.length) < 4 * AVERAGE_X_BLOCKS) {
                return Math.max(
                    Math.floor(
                        BASE_DIFFICULTY / Math.pow(
                        Math.floor(((index || blocks.length) + 1) / EVERY_X_BLOCKS) + 1
                        , POW_CURVE)
                    )
                    , 0);
            } else if ((index || blocks.length) % AVERAGE_X_BLOCKS === 0) {
                return parseInt(blocks[(index || blocks.length) - 1].hash.substring(0, 14), 16) - (((blocks[(index || blocks.length) - 1].timestamp - blocks[(index || blocks.length) - 1 - AVERAGE_X_BLOCKS].timestamp) / AVERAGE_X_BLOCKS) > 1.5 * EVERY_X_SECONDS ? 100 : 0) + (((blocks[(index || blocks.length) - 1].timestamp - blocks[(index || blocks.length) - AVERAGE_X_BLOCKS - 1].timestamp) / AVERAGE_X_BLOCKS) < EVERY_X_SECONDS / 1.5 ? 100 : 0);
            }
            return parseInt(blocks[(index || blocks.length) - 1].hash.substring(0, 14), 16);
            */
        }
    }
};
