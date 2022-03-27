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

const gasPrice = 2000000000;

// Example: HARDHAT_NETWORK='izumiTest' node scripts/reservedMintFor.js [address] [quantity]

const para = {
    address: v[2],
    quantity: v[3]
}
console.log(para);


//mint uniswap v3 nft
async function main() {

    const [deployer] = await hardhat.ethers.getSigners();

    const hourAiAddress = deployed[net].HOURAI;
    const hourAi = houraiLib.getHourAi(hourAiAddress);

    console.log('hourAi addr: ', hourAiAddress);

    const txData = await hourAi.methods.reservedMintFor(para.quantity, para.address).encodeABI()
    const gas = await hourAi.methods.reservedMintFor(para.quantity, para.address).estimateGas({from: deployer.address});
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
    console.log('tx sent: ', txSent);
      
}
main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
})
