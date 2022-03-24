const hardhat = require("hardhat");
const contracts = require("./deployed.js");

const v = process.argv
const net = process.env.HARDHAT_NETWORK



async function main() {
    
  const [deployer] = await hardhat.ethers.getSigners();

  const hourAiStableFactory = await hardhat.ethers.getContractFactory("HOURAIStable");
  const hourAiAddress = contracts[net].HOURAI;

  const hourAiStable = await hourAiStableFactory.deploy(hourAiAddress);
  await hourAiStable.deployed();
  console.log('hourai stable contract address: ', hourAiStable.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });