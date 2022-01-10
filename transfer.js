'use strict';

const balanceRead = require('./balance-read');
const utils = require('./utils');

const GAS_MIN = 1.1;
const GAS_LIMIT = 1;

const transactionConfigureGas = async function (web3, chainId, address, transaction) {
    const nonce = await web3.eth.getTransactionCount(address);

    const avgGasPrice = await web3.eth.getGasPrice();
    const estimateGas = await web3.eth.estimateGas(transaction);

    return Object.assign({}, transaction, {
        gas: web3.utils.toHex(Math.trunc(estimateGas * GAS_MIN)),
        gasLimit: web3.utils.toHex(Math.trunc(estimateGas * GAS_LIMIT)),
        gasPrice: web3.utils.toHex(avgGasPrice),
        chainId: chainId,
        nonce: web3.utils.toHex(nonce)
    });
};

const mainAmountSubtractFee = async function (web3, fromAddress, toAddress) {
    const amountCurrent = await balanceRead.getBalance(web3, fromAddress)
    const amount = web3.utils.toWei(amountCurrent.toString(), 'ether');

    const avgGasPrice = await web3.eth.getGasPrice();
    const estimateGas = await web3.eth.estimateGas({
        value: web3.utils.toHex(amount),
        from: fromAddress,
        to: toAddress
    });
    
    const amountBN = web3.utils.toBN(amount)
        .sub(web3.utils.toBN(avgGasPrice).mul(web3.utils.toBN(Math.trunc(estimateGas))))
    
    return amountBN.isNeg() || amountBN.isZero() ? "0" : amountBN.toString();
}

const mainWithMount = async function (web3, privateKey, chainId, fromAddress, toAddress, amount) {
    const balance = amount || await mainAmountSubtractFee(web3, fromAddress, toAddress);
    const mainAmount = typeof balance === 'string' ? balance : web3.utils.toWei(balance.toString(), 'ether');

    if (mainAmount === '0') {
        throw Error('Insufficient amount.');
    }

    const transaction = await transactionConfigureGas(
        web3,
        chainId,
        fromAddress,
        {
            value: web3.utils.toHex(mainAmount),
            from: fromAddress,
            to: toAddress
        }
    );

    const senderAccount = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
    const signedTransaction = await senderAccount.signTransaction(transaction);

    return web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
};

const tokenWithAmount = async function (web3, privateKey, chainId, tokenAddress, fromAddress, toAddress, amount) {
    const balance = amount || await balanceRead.getBalanceOfToken(web3, tokenAddress, fromAddress)
    const tokenAmount = web3.utils.toWei(balance.toString(), 'ether');

    const contract = utils.getContractTransfer(web3, tokenAddress, fromAddress);

    const transaction = await transactionConfigureGas(
        web3,
        chainId,
        fromAddress,
        {
            value: '0x0', // Only tokens
            data: contract.methods.transfer(toAddress, tokenAmount).encodeABI(),
            from: fromAddress,
            to: tokenAddress
        }
    );

    const senderAccount = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
    const signedTransaction = await senderAccount.signTransaction(transaction);

    return web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
};

exports.mainWithMount = mainWithMount;
exports.tokenWithAmount = tokenWithAmount;