'use strict';

const utils = require('./utils');

const getBalance = function(web3, address, fromUnit) {

    return new Promise(async (resolve, reject) => {
        try {
            const balance = await web3.eth.getBalance(address);
            resolve(web3.utils.fromWei(balance, fromUnit || 'ether'));
        }
        catch (e) {
            reject(e);
        }
    });
}

const getBalanceOfToken = function(web3, tokenAddress, address, fromUnit) {
    return new Promise(async (resolve, reject) => {
        try {
            const contract = utils.getContract(web3, tokenAddress);
            const result = await contract.methods.balanceOf(address).call(); 
            resolve(web3.utils.fromWei(result, fromUnit || 'ether'));
            
        } catch (e) {
            reject(e);
        }
    });
}

const balancesWithTokens = function(web3, tokens, address, fromUnit) {
    const arr = [getBalance(web3, address, fromUnit)];
    for (let i in tokens) {
        if (tokens[i].address === '0x0') {
            continue;
        }

        arr.push(getBalanceOfToken(web3, tokens[i].address, address, fromUnit));
    }

    return new Promise(async (resolve, reject) => {
        try {
            const result = await Promise.all(arr);

            for (let i in tokens) {
                tokens[i].balance = result[i];
            }

            resolve(tokens);
        } catch (e) {
            reject(e);
        }
    })
}

exports.getBalance = getBalance;
exports.getBalanceOfToken = getBalanceOfToken;
exports.balancesWithTokens = balancesWithTokens;