const R = require('ramda');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const TransactionAssertionError = require('./transactionAssertionError');

const FEE_PER_TRANSACTION = 1;

class Transaction {
    construct() {
        this.id = null;
        this.hash = null;
        this.data = {
            inputs: [],
            outputs: []
        };
    }

    static fromJson(data) {
        let transaction = new Transaction();
        R.forEachObjIndexed((value, key) => { transaction[key] = value; }, data);
        return transaction;
    }

    check() {
        let isTransactionHashValid = CryptoUtil.hash(this.id + JSON.stringify(this.data)) == this.hash;

        if (!isTransactionHashValid) throw new TransactionAssertionError(`Invalid transaction hash '${this.hash}'`, this);

        R.map((txInput) => {
            let txInputHash = CryptoUtil.hashObject({
                transaction: txInput.transaction,
                index: txInput.index,
                address: txInput.address
            });
            let isValidSignature = CryptoEdDSAUtil.verifySignature(txInput.address, txInput.signature, txInputHash);

            if (!isValidSignature) throw new TransactionAssertionError(`Invalid transaction input signature '${JSON.stringify(txInput)}'`, txInput);
        }, this.data.inputs);


        let sumOfInputsAmount = R.sum(R.map(R.prop('amount'), this.data.inputs));
        let sumOfOutputsAmount = R.sum(R.map(R.prop('amount'), this.data.outputs));

        let isInputsAmountGreaterOrEqualThanOutputsAmount = R.gte(sumOfInputsAmount, sumOfOutputsAmount);

        if (!isInputsAmountGreaterOrEqualThanOutputsAmount) throw new TransactionAssertionError(`Invalid transaction balance, inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`, { sumOfInputsAmount, sumOfOutputsAmount });

        let isEnoughFee = (sumOfInputsAmount - sumOfOutputsAmount) >= FEE_PER_TRANSACTION; // 1 because the fee is 1 sathoshi per transaction

        if (!isEnoughFee) throw new TransactionAssertionError(`Not enough fee expected '${FEE_PER_TRANSACTION}' found '${(sumOfInputsAmount - sumOfOutputsAmount)}'`, { sumOfInputsAmount, sumOfOutputsAmount, FEE_PER_TRANSACTION });

        return true;
    }
}

module.exports = Transaction;