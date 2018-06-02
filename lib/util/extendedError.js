const ExtendableError = require('es6-error');

class ExtendedError extends ExtendableError {
    constructor(message, original, context) {
        super(message);        
        if (original) this.original = { message: original.message, stack: original.stack };
        if (context) this.context = context;
    }

    toJSON() {
        const { message, type, stack, original, context } = this;
        return Object.assign({ message, type, stack, original, context }, this);
    }

    toPrint() {
        return this.stack +
            (this.original ? '\n' + 'Caused by' + '\n' + (this.original.toPrint ? this.original.toPrint() : this.original.stack) : '');
    }
}

module.exports = ExtendedError;