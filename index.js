'use strict';

const Web3 = require('web3');
const balance = require('./balance-read');
const config = require('./config');
const transfer = require('./transfer');

const data = config.isProduction ? config.production : config.test;
const log = require('simple-node-logger').createRollingFileLogger(data.log);

const tokens = data.tokens;

const web3 = new Web3(new Web3.providers.HttpProvider(data.provider));
web3.eth.accounts.wallet.add(data.privateKey);
const account = web3.eth.accounts.wallet[0].address

log.info(`Address configured: ${account}`);
let isBlockedTracking = false;

/* Simple way to monitor an address balance and if there is balance it is transferred to another address. */
const trackingAddress = async function () {
    const balances = await balance.balancesWithTokens(web3, tokens, account);
    const token = tokens[1];

    log.info(balances);

    if (token.balance <= 0.0) {
        return;
    }

    log.info("Transferring balance.");

    try {
        const result = await transfer.tokenWithAmount(
            web3,
            data.privateKey,
            data.chainId,
            token.address,
            account,
            data.toAddress
        );

        log.info("Txn: ", result);
    } catch (e) {
        log.error("Transfer error: ", e);
    }
}

const watchDog = function () {
    setInterval(async () => {

        if (!isBlockedTracking) {
            try {

                isBlockedTracking = true;
                await trackingAddress();
                isBlockedTracking = false;

            } catch (e) {
                isBlockedTracking = false;
                log.error(e);
            }
        }

    }, data.watchDogTimeout);
}

watchDog();