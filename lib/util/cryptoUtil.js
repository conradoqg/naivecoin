const crypto = require('crypto');

class CryptoUtil {
    static hash(any) {
        let anyString = any.toString();
        let anyHash = CryptoUtil.hashString(anyString);
        console.debug(`Any hash: \n${anyHash}`);
        return anyHash;
    }

    static hashString(string) {
        let stringHash = crypto.createHash('sha256').update(string).digest('hex');
        return stringHash;
    }

    static hashObject(object) {
        let objectString = JSON.stringify(object);
        let objectHash = CryptoUtil.hashString(objectString);
        console.debug(`Message hash: \n${objectHash}`);
        return objectHash;
    }

    static randomId(size = 64) {
        return crypto.randomBytes(Math.floor(size / 2)).toString('hex');
    }
}

module.exports = CryptoUtil;