const ExtendedError = require('../util/extendedError');
const statuses = require('statuses');

class HTTPError extends ExtendedError {
    constructor(status, message, context, original) {
        if (!message) message = status + ' - ' + statuses[status];
        super(message, context, original);
        if (status) this.status = status;
    }

    toJSON() {
        const { status } = this;
        return Object.assign({ status }, this);
    }
}

module.exports = HTTPError;
