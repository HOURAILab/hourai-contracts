const hardhat = require("hardhat");
const contracts = require("./deployed.js");

const v = process.argv
const net = process.env.HARDHAT_NETWORK

const para = {
  recipient: v[2],
}

async function main() {

  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }

  console.log("Deploying .....");

  const hourAiStableFactory = await hardhat.ethers.getContractFactory("HOURAIStable");
  const hourAiAddress = contracts[net].HOURAI;

  const hourAiStable = await hourAiStableFactory.deploy(hourAiAddress, para.recipient);
  await hourAiStable.deployed();
  console.log('hourai stable contract address: ', hourAiStable.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });