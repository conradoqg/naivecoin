const Config = require('../../config');
const ProofOfWork = require('./proofOfWork');
const ProofOfAuthority = require('./proofOfAuthority');
const ArgumentError = require('../../util/argumentError');

class ProofSystem {
    static create(proofSystem = Config.PROOF_SYSTEM) {
        if (proofSystem == 'proofOfWork') return new ProofOfWork();
        else if (proofSystem == 'proofOfAuthority') return new ProofOfAuthority(Config.proofOfAuthority.allowedPublicKeys);
        else throw new ArgumentError(`Invalid proof system '${Config.PROOF_SYSTEM}'`);
    }
}

module.exports = ProofSystem;