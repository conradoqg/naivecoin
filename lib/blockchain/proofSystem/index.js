const Config = require('../../config');
const ProofOfWork = require('./proofOfWork');

let proofSystem = null;
if (Config.PROOF_SYSTEM == 'proofOfWork') proofSystem = ProofOfWork;

module.exports = proofSystem;