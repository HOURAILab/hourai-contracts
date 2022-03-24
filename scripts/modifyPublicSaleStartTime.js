const hardhat = require("hardhat");
const contracts = require("./deployed.js");
const BigNumber = require("bignumber.js");

// example
// HARDHAT_NETWORK='izumiTest' \
//     node setTestWhiteList.js [timestamp]
const v = process.argv
const net = process.env.HARDHAT_NETWORK

const para = {
    timestamp: v[2]
}

async function main() {
    
  const [deployer] = await hardhat.ethers.getSigners();

  const hourAiAddress = contracts[net].HOURAI;

  const hourAiFactory = await hardhat.ethers.getContractFactory("HOURAI");
  const hourAi = hourAiFactory.attach(hourAiAddress);

//   console.log("Paramters: ");
//   for ( var i in para) { console.log("    " + i + ": " + para[i]); }

//   console.log("Deploying .....");

  console.log(await hourAi.config());

  await hourAi.modifystartTimeOfPublicSale(para.timestamp);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });