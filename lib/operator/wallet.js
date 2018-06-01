const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');

class Wallet {
    constructor() {
        this.id = null;
        this.passwordHash = null;
        this.secret = null;
        this.addresses = [];
    }

    generateAddress() {
        // If secret is null means it is a brand new wallet
        if (this.secret == null) {
            this.generateSecret();
        }

        let lastKeyPair = R.last(this.addresses);
        
        // Generate next seed based on the first secret or a new secret from the last key pair.
        let seed = (lastKeyPair == null ? this.secret : CryptoEdDSAUtil.generateSecret(R.propOr(null, 'secretKey', lastKeyPair)));
        let keyPairRaw = CryptoEdDSAUtil.generateKeyPairFromSecret(seed);
        let address = {
            id: CryptoEdDSAUtil.toHex(keyPairRaw.getPublic()),
            index: this.addresses.length + 1,
            secretKey: CryptoEdDSAUtil.toHex(keyPairRaw.getSecret()),
            publicKey: CryptoEdDSAUtil.toHex(keyPairRaw.getPublic())
        };
        this.addresses.push(address);
        return address;
    }

    generateSecret() {
        this.secret = CryptoEdDSAUtil.generateSecret(this.passwordHash);
        return this.secret;
    }

    getAddressByIndex(index) {
        return R.find(R.propEq('index', index), this.addresses);
    }

    getAddressByID(id) {
        return R.find(R.propEq('id', id), this.addresses);
    }

    getAddressByPublicKey(publicKey) {
        return R.find(R.propEq('publicKey', publicKey), this.addresses);
    }

    getSecretKeyByAddress(address) {
        return R.propOr(null, 'secretKey', R.find(R.propEq('publicKey', address), this.addresses));
    }

    getAddresses() {
        return this.addresses;
    }

    static fromPassword(password) {
        let wallet = new Wallet();
        wallet.id = CryptoUtil.randomId();
        wallet.passwordHash = CryptoUtil.hash(password);
        return wallet;
    }

    static fromHash(passwordHash) {
        let wallet = new Wallet();
        wallet.id = CryptoUtil.randomId();
        wallet.passwordHash = passwordHash;
        return wallet;
    }

    static fromJson(data) {
        let wallet = new Wallet();
        R.forEachObjIndexed((value, key) => { wallet[key] = value; }, data);
        return wallet;
    }
}

module.exports = Wallet;