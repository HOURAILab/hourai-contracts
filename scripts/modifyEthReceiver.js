var Web3 = require('web3');
const secret = require('../.secret.js')
const BigNumber = require('bignumber.js')
var pk = secret.pk;
var pkDeployer = secret.pk;

const hardhat = require("hardhat");

const deployed = require("./deployed.js");
const config = require('../hardhat.config.js');

const v = process.argv
const net = process.env.HARDHAT_NETWORK

const rpc = config.networks[net].url

var web3 = new Web3(new Web3.providers.HttpProvider(rpc));
const houraiLib = require('./libraries/hourai');

const gasPrice = 2000000000;

const newEthAddress = v[2];
console.log('new eth address: ', newEthAddress);

//mint uniswap v3 nft
async function main() {

    const hourAiAddress = deployed[net].HOURAI;
    const hourAi = houraiLib.getHourAi(hourAiAddress);

    console.log('hourAi addr: ', hourAiAddress);
    const deployer = web3.eth.accounts.privateKeyToAccount(pkDeployer).address;
    console.log('deployer: ', deployer);
    const account = web3.eth.accounts.privateKeyToAccount(pk).address;
    console.log('account: ', account);

    const txData = await hourAi.methods.modifyEthReceiver(newEthAddress).encodeABI()
    const gas = await hourAi.methods.modifyEthReceiver(newEthAddress).estimateGas({from: deployer});
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
    try {
    const txSent = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('txSent: ', txSent);
    } catch(err) {
        console.log(err);
    }     
}
main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
})
