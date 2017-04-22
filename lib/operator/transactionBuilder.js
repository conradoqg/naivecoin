const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');
const R = require('ramda');
const assert = require('assert');

class TransactionBuilder {
    constructor() {
        this.listOfUTXO = null;
        this.outputAddresses = null;
        this.totalAmount = null;
        this.changeAddress = null;
        this.feeAmount = 0;
        this.secretKey = null;
    }

    from(listOfUTXO) {
        this.listOfUTXO = listOfUTXO;
        return this;
    }

    to(address, amount) {
        this.outputAddress = address;
        this.totalAmount = amount;
        return this;
    }

    change(changeAddress) {
        this.changeAddress = changeAddress;
        return this;
    }

    fee(amount) {
        this.feeAmount = amount;
        return this;
    }

    sign(secretKey) {
        this.secretKey = secretKey;
        return this;
    }

    build() {
        // TODO: Should change this to a custom error and check if there are enough balance to create this transaction
        assert.notEqual(this.listOfUTXO, null, 'It\'s necessary to inform a list of unspent output transactions.');
        assert.notEqual(this.outputAddress, null, 'It\'s necessary to inform the destination address.');
        assert.notEqual(this.totalAmount, null, 'It\'s necessary to inform the transaction value.');

        /*
        Transaction structure:
        let transaction = {
            id: '', // id of data            
            hash: '', // hash of data            
            data: {
                inputs: [ // array of transaction inputs
                    {
                        transaction: '', // pointer to transaction output
                        index: 0, // index of the transaction output
                        address: '', // public key/address to check signature
                        signature: '' // signature of transaction output                    
                    }
                ], // array of transaction outputs
                outputs: [
                    {
                        amount: 0, // satoshis format
                        address: '', // Usually here is a locking script (to check who and when this transaction output can be used), in this case it's simple the destination address 
                    }
                ],
            }
        };
        */

        let transaction = {
            id: CryptoUtil.randomId(64),
            hash: null,
            data: {
                inputs: [],
                outputs: []
            }
        };

        // Calculates the change amount
        let totalAmountOfUTXO = R.sum(R.pluck('amount', this.listOfUTXO));
        let changeAmount = totalAmountOfUTXO - this.totalAmount - this.feeAmount;

        // For each transaction input, calculates the hash of the input and sign the data.
        let self = this;
        transaction.data.inputs = R.map((utxo) => {
            let txiHash = CryptoUtil.hashObject({
                transaction: utxo.transaction,
                index: utxo.index,
                address: utxo.address
            });
            utxo.signature = CryptoEdDSAUtil.signHash(CryptoEdDSAUtil.generateKeyPairFromSecret(self.secretKey), txiHash);
            return utxo;
        }, this.listOfUTXO);
        transaction.data.outputs = [];

        // Add target receiver
        transaction.data.outputs.push({
            amount: this.totalAmount,
            address: this.outputAddress
        });

        // Add change amount
        if (changeAmount > 0) {
            transaction.data.outputs.push({
                amount: changeAmount,
                address: this.changeAddress
            });
        }

        // The remaining value is the fee to be collected by the block's creator.

        // Creates a hash of the transaction and sets as its ID.
        transaction.hash = CryptoUtil.hash(transaction.id + JSON.stringify(transaction.data));

        return transaction;
    }
}

module.exports = TransactionBuilder;