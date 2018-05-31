const Config = require('../../config');
const ProofOfWork = require('./proofOfWork');
const ProofOfAuthority = require('./proofOfAuthority');
const ArgumentError = require('../../util/argumentError');

class ProofSystem {
    static create() {        
        if (Config.PROOF_SYSTEM == 'proofOfWork') return new ProofOfWork();
        else if (Config.PROOF_SYSTEM == 'proofOfAuthority') return new ProofOfAuthority();
        else throw new ArgumentError(`Invalid proof system '${Config.PROOF_SYSTEM}'`);
    }
}

module.exports = ProofSystem;