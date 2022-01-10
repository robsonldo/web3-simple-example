'use strict';

const abi = require('./abi.json')

exports.getContract = function (web3, tokenAddress) {
    return new web3.eth.Contract(abi, tokenAddress);
}

exports.getContractTransfer = function (web3, tokenAddress, fromAddress) {
    return new web3.eth.Contract(abi, tokenAddress, {
        from: fromAddress
    });
}