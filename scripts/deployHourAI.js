const hardhat = require("hardhat");
const contracts = require("./deployed.js");
const BigNumber = require("bignumber.js");

// example
// HARDHAT_NETWORK='izumiTest' \
//     node deployVeiZi.js [name] [symbol] [baseURI] \
//     [maxBatchSize] [maxSize] [maxMintSize] \ 
//     [startTimeOfWhiteListMint] [startTimeOfPublicSale] \
//     [priceOfWhiteListMintABC] [priceOfWhiteListMintD] [priceOfPublicSale]
//     [ethReceiverAddress]
const v = process.argv
const net = process.env.HARDHAT_NETWORK


var para = {
    name: v[2],
    symbol: v[3],
    baseURI: v[4],
    maxBatchSize: v[5],
    maxSize: v[6],
    maxMintSize: v[7],
    startTimeOfWhiteListMint: v[8],
    startTimeOfPublicSale: v[9],
    priceOfWhiteListMintABC: BigNumber(v[10]).times(10 ** 18).toFixed(0, 2),
    priceOfWhiteListMintD: BigNumber(v[11]).times(10 ** 18).toFixed(0, 2),
    priceOfPublicSale: BigNumber(v[12]).times(10 ** 18).toFixed(0, 2),
    ethReceiver: v[13],
}


async function main() {
    
  const [deployer] = await hardhat.ethers.getSigners();

  const hourAiFactory = await hardhat.ethers.getContractFactory("HOURAI");

  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }

  console.log("Deploying .....");


  const args = [
    para.name,
    para.symbol,
    para.baseURI,
    {
        maxBatchSize: para.maxBatchSize,
        maxSize: para.maxSize,
        maxMintSize: para.maxMintSize,
        maxReservedSize: 0,
        startTimeOfWhiteListMint: para.startTimeOfWhiteListMint,
        startTimeOfPublicSale: para.startTimeOfPublicSale,
        priceOfWhiteListMintABC: para.priceOfWhiteListMintABC,
        priceOfWhiteListMintD: para.priceOfWhiteListMintD,
        priceOfPublicSale: para.priceOfPublicSale
    },
    para.ethReceiver
  ]

  console.log('args: ', args);

  const hourAi = await hourAiFactory.deploy(...args);
  await hourAi.deployed();
  console.log('hourai contract address: ', hourAi.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });