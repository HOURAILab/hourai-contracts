var Web3 = require('web3');
const secret = require('../.secret.js')
const BigNumber = require('bignumber.js')
var pk = secret.pk;

const hardhat = require("hardhat");

const deployed = require("./deployed.js");
const config = require('../hardhat.config.js');

const v = process.argv
const net = process.env.HARDHAT_NETWORK

const rpc = config.networks[net].url

var web3 = new Web3(new Web3.providers.HttpProvider(rpc));
const houraiLib = require('./libraries/hourai');
const { assert } = require('console');

const gasPrice = 2000000000;

// Example: HARDHAT_NETWORK='izumiTest' node scripts/setWhiteList.js [addrListPath] [accountType] [sendDelta]

function getAccountType(charType) {
    assert(charType === 'A' || charType === 'B' || charType === 'C' || charType == 'D', 'account type error')
    if (charType === 'A') {
        return 1;
    }
    if (charType === 'B') {
        return 2;
    }
    if (charType === 'C') {
        return 3;
    }
    if (charType === 'D') {
        return 4;
    }
}

const para = {
    addrListPath: v[2],
    accountType: getAccountType(v[3]),
    sendDelta: Number(v[4])
}
console.log(para);

function getAddrList(path) {
    const fs = require('fs');
    let rawdata = fs.readFileSync(path);
    const data = rawdata.toString().split('\n');
    const addrList = [];
    for (const addr of data) {
        if (addr !== '') {
            addrList.push(addr);
        }
    }
    return addrList;
}

//mint uniswap v3 nft
async function main() {

    const [deployer] = await hardhat.ethers.getSigners();

    const addrList = getAddrList(para.addrListPath);

    var originSendAddrNum = 0;

    const hourAiAddress = deployed[net].HOURAI;
    const hourAi = houraiLib.getHourAi(hourAiAddress);

    console.log('hourAi addr: ', hourAiAddress);

    const addrListLen = addrList.length;
    // var nonce = 42;
    for (let addrListStart = originSendAddrNum; addrListStart < addrListLen; addrListStart += para.sendDelta) {

        const t1 = new Date().getTime();
        const addrListEnd = Math.min(addrListStart + para.sendDelta, addrListLen);

        // first, mint
        const addrSubList = addrList.slice(addrListStart, addrListEnd);
        console.log('addr sub list:' , addrSubList);

        const txData = await hourAi.methods.setWhiteListAddress(addrSubList, para.accountType).encodeABI()
        const gas = await hourAi.methods.setWhiteListAddress(addrSubList, para.accountType).estimateGas({from: deployer.address});
        console.log('gas: ', gas);
        const gasLimit = BigNumber(gas * 1.1).toFixed(0, 2);
        console.log('gasLimit: ', gasLimit);
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                // nonce: nonce,
                to: hourAiAddress,
                data:txData,
                gas: gasLimit,
                gasPrice: gasPrice,
            }, 
            pk
        );
        // nonce += 1;

        const txSent = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('txSent: ', txSent);
        console.log('has send num: ', addrListEnd)

        const t2 = new Date().getTime();
        const interval = t2 - t1;
        console.log('interval: ', interval);
    }

}
main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
})
