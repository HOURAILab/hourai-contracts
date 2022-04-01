
const { checkProperties } = require("@ethersproject/properties");
const { BigNumber } = require("bignumber.js");
const { expect } = require("chai");
const hardhat = require('hardhat');
const { ethers, web3} = require("hardhat");const { default: Web3 } = require("web3");
;


function decimal2Amount(amountDecimal, decimal) {
    return new BigNumber(amountDecimal).times(10**decimal).toFixed(0);
}

function stringDiv(a, b) {
    let an = new BigNumber(a);
    an = an.minus(an.mod(b));
    return an.div(b).toFixed(0, 3);
}

function stringMod(a, b) {
    let an = new BigNumber(a);
    return an.mod(b).toFixed(0, 3);
}

function stringMul(a, b) {
    let an = new BigNumber(a);
    an = an.times(b);
    return an.toFixed(0, 3);
}

function stringMinus(a, b) {
    let an = new BigNumber(a);
    an = an.minus(b);
    return an.toFixed(0, 3);
}

function stringAdd(a, b) {
    let an = new BigNumber(a);
    an = an.plus(b);
    return an.toFixed(0, 3);
}

function stringMin(a, b) {
    const an = new BigNumber(a);
    const bn = new BigNumber(b);
    if (an.gte(bn)) {
        return b;
    }
    return a;
}

function stringLTE(a, b) {
    const an = new BigNumber(a);
    const bn = new BigNumber(b);
    return an.lte(bn);
}

function stringGT(a, b) {
    const an = new BigNumber(a);
    const bn = new BigNumber(b);
    return an.gt(bn);
}

function stringAbs(a) {
    const an = new BigNumber(a);
    if (an.lt(0)) {
        return an.times('-1').toFixed(0);
    }
    return an.toFixed(0);
}

async function mint(hourai, miner, value, quantity) {
    let ok = true;
    try {
        await hourai.connect(miner).mint(quantity, {value});
    } catch (err) {
        console.log(err);
        ok = false;
    }
    return ok;
}

async function stake(stable, miner, houraiId) {
    let ok = true;
    try {
        await stable.connect(miner).stake(houraiId);
    } catch (err) {
        // console.log(err); 
        ok = false;
    }
    return ok;
}

async function modifyRecipient(stable, owner, recipientAddress) {
    let ok = true;
    try {
        await stable.connect(owner).modifyRecipient(recipientAddress);
    } catch (err) {
        // console.log(err);
        ok = false;
    }
    return ok;
}

async function getRecipient(stable){ 
    return (await stable.recipient()).toLowerCase();
}

async function transferTokens(stable, owner, hourAiIdList) {
    let ok = true;
    try {
        await stable.connect(owner).transferTokens(hourAiIdList);
    } catch (err) {
        // console.log(err);
        ok = false;
    }
    return ok;
}

async function getHourAiId(stable, stableId) {
    return (await stable.hourAiIds(stableId)).toString();
}

async function nftNum(stable) {
    return (await stable.nftNum()).toString();
}

async function expectGt(a, b) {
    expect(BigNumber(a).gt(b)).to.equal(true);
}

async function owner(contract, tokenId) {
    try {
    return (await contract.ownerOf(tokenId)).toLowerCase();
    } catch(err){
        return '0x0';
    }
}

async function transferFrom(address, fromPk, fromAddr, toAddr, tokenId) {
    const abi = [
    {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
    ];
    const contract = new web3.eth.Contract(abi, address);
    
    const txData = await contract.methods.safeTransferFrom(fromAddr, toAddr, tokenId).encodeABI()
    const gas = await contract.methods.safeTransferFrom(fromAddr, toAddr, tokenId).estimateGas({from: fromAddr});
    console.log('gas: ', gas);
    const gasLimit = BigNumber(gas * 1.1).toFixed(0, 2);
    console.log('gasLimit: ', gasLimit);
    const signedTx = await web3.eth.accounts.signTransaction(
        {
            // nonce: nonce,
            to: address,
            data:txData,
            gas: gasLimit,
        }, 
        fromPk,
    );
    
    const txSent = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    // console.log('txSent: ', txSent);
}

async function tokenURI(hourai, tokenId) {
    return await hourai.tokenURI(tokenId);
}

async function setBaseURI(hourai, miner, newBaseURI) {
    let ok = true;
    try {
        await hourai.connect(miner).setBaseURI(newBaseURI);
    } catch(err) {
        ok = false;
    }
    return ok;
} 

describe("test uniswap price oracle", function () {

    var signer, minerC1, minerC2, minerC3, minerC4, minerC5, minerC6, minerC7, minerC8, miner1, miner2, miner3;
    var receiver2, receiver3;
    var hourai;
    var houraiStable;
    var hugeAmount;
    var timestampStart;
    var startTimeOfWhiteListMint;
    var startTimeOfPublicSale;

    var priceOfWhiteListMintABC;
    var priceOfWhiteListMintD;
    var priceOfPublicSale;

    var zero;


    var receiver1Pk;
    var receiver1Addr;

    var receiver1;

    beforeEach(async function() {

        hugeAmount = '1000000000000000000000000000000';

        receiver1Pk = 'eafb1fad24a0ee78edd2082f5ceddafc3a2bab0107b46941d91e91c499cbf342';
        receiver1Addr = '0x7576BCf2700A86e8785Cfb1f9c2FF402941C9789';

        receiver1 = {
            pk: receiver1Pk,
            address: receiver1Addr,
        };
      
        [
            signer, 
            minerC1, minerC2, minerC3, 
            miner1, miner2, miner3, 
            receiver2, receiver3
        ] = await ethers.getSigners();
        await signer.sendTransaction({
            to: receiver1Addr,
            value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
          });

        const houraiFactory = await ethers.getContractFactory('HOURAI');

        // struct Config {
        //     uint256 maxBatchSize;
        //     uint256 maxSize;
        //     uint256 startTimeOfWhiteListMint;
        //     uint256 startTimeOfPublicSale;
        //     uint256 priceOfWhiteListMint;
        //     uint256 priceOfPublicSale;
        // }

        const blockNumStart = await ethers.provider.getBlockNumber();
        const blockStart = await ethers.provider.getBlock(blockNumStart);
        timestampStart = blockStart.timestamp;

        startTimeOfWhiteListMint = timestampStart + 200;
        startTimeOfPublicSale = timestampStart + 500000000;

        console.log('startTimeOfWhiteListMint: ', startTimeOfWhiteListMint)

        priceOfWhiteListMintABC = BigNumber(0.12).times(10**18).toFixed(0,3)
        priceOfWhiteListMintD = BigNumber(0.15).times(10**18).toFixed(0,3)
        priceOfPublicSale = BigNumber(0.2).times(10**18).toFixed(0,3)

        const config = {
            maxBatchSize: 3,
            maxSize: 3000,
            maxMintSize: 2400,
            maxReservedSize: 0,
            startTimeOfWhiteListMint,
            startTimeOfPublicSale,
            priceOfWhiteListMintABC,
            priceOfWhiteListMintD,
            priceOfPublicSale
        };
        console.log(config);

        hourai = await houraiFactory.deploy(
            "hourai", "hai", "www.baidu.com/",
            config,
            receiver3.address
        );

        const stableFactory = await ethers.getContractFactory('HOURAIStable');
        houraiStable = await stableFactory.deploy(hourai.address, receiver1Addr);

        await hourai.setWhiteListAddress([minerC1.address, minerC2.address, minerC3.address], 3);
        
        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);

        await mint(hourai, minerC1, stringMul(priceOfWhiteListMintABC, 5), 5);
        await mint(hourai, minerC2, stringMul(priceOfWhiteListMintABC, 10), 10);
        await mint(hourai, minerC3, stringMul(priceOfWhiteListMintABC, 8), 8);

        await hourai.connect(minerC1).setApprovalForAll(houraiStable.address, true);
        await hourai.connect(minerC2).setApprovalForAll(houraiStable.address, true);
        await hourai.connect(minerC3).setApprovalForAll(houraiStable.address, false);

        zero = '0x0000000000000000000000000000000000000000';
    });

    it("stake", async function() {
        expect(await owner(hourai, '0')).to.equal(minerC1.address.toLowerCase());
        expect(await owner(hourai, '1')).to.equal(minerC1.address.toLowerCase());
        expect(await owner(hourai, '2')).to.equal(minerC1.address.toLowerCase());

        const stake0 = await stake(houraiStable, minerC1, 0);
        const stake1 = await stake(houraiStable, minerC1, 1);
        const stake2_C2 = await stake(houraiStable, minerC2, 2);
        const stake2_C3 = await stake(houraiStable, minerC3, 2);
        const stake2_miner1 = await stake(houraiStable, miner1, 2);
        expect(stake0).to.equal(true);
        expect(stake1).to.equal(true);
        expect(stake2_C2).to.equal(false);
        expect(stake2_C3).to.equal(false);
        expect(stake2_miner1).to.equal(false);
        
        expect(await getHourAiId(houraiStable, '1')).to.equal('0');
        expect(await getHourAiId(houraiStable, '2')).to.equal('1');
        expect(await nftNum(houraiStable)).to.equal('2');

        expect(await owner(hourai, '0')).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, '1')).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, '2')).to.equal(minerC1.address.toLowerCase());
        expect(await owner(houraiStable, '1')).to.equal(minerC1.address.toLowerCase());
        expect(await owner(houraiStable, '2')).to.equal(minerC1.address.toLowerCase());
        expect(await owner(houraiStable, '3')).to.equal('0x0');

        const stake2 = await stake(houraiStable, minerC1, 2);
        expect(stake2).to.equal(true);
        expect(await getHourAiId(houraiStable, '1')).to.equal('0');
        expect(await getHourAiId(houraiStable, '2')).to.equal('1');
        expect(await getHourAiId(houraiStable, '3')).to.equal('2');
        expect(await nftNum(houraiStable)).to.equal('3');

        const stake6 = await stake(houraiStable, minerC2, 6);
        const stake8 = await stake(houraiStable, minerC2, 8);
        expect(stake6).to.equal(true);
        expect(stake8).to.equal(true);
        expect(await getHourAiId(houraiStable, '4')).to.equal('6');
        expect(await getHourAiId(houraiStable, '5')).to.equal('8');
        expect(await nftNum(houraiStable)).to.equal('5');

        const stake16 = await stake(houraiStable, minerC2, 16);
        const stake17 = await stake(houraiStable, minerC2, 17);
        const stake18 = await stake(houraiStable, minerC2, 18);
        expect(stake16).to.equal(false);
        expect(stake17).to.equal(false);
        expect(stake18).to.equal(false);
        expect(await getHourAiId(houraiStable, '6')).to.equal('0');
        expect(await nftNum(houraiStable)).to.equal('5');

    });

    it("base uri", async function() {

        await stake(houraiStable, minerC1, 0);
        await stake(houraiStable, minerC1, 1);
        
        console.log(await tokenURI(houraiStable, '1'));
        console.log(await tokenURI(houraiStable, '2'));

        const okMiner1 = await setBaseURI(houraiStable, miner1, 'www.google.com/');
        expect(okMiner1).to.equal(false);

        console.log(await tokenURI(houraiStable, '1'));
        console.log(await tokenURI(houraiStable, '2'));

        const okOwner = await setBaseURI(houraiStable, signer, 'www.sogou.com/');
        expect(okOwner).to.equal(true);

        console.log(await tokenURI(houraiStable, '1'));
        console.log(await tokenURI(houraiStable, '2'));
    });

    it("modify recipient and transfer and repeat mint", async function() {

        await stake(houraiStable, minerC1, 0);
        await stake(houraiStable, minerC1, 1);
        await stake(houraiStable, minerC1, 2);
        await stake(houraiStable, minerC1, 3);
        await stake(houraiStable, minerC1, 4);
        await stake(houraiStable, minerC2, 5);
        await stake(houraiStable, minerC2, 6);
        await stake(houraiStable, minerC2, 7);
        await stake(houraiStable, minerC2, 8);
        await stake(houraiStable, minerC2, 9);

        for (let idx = 0; idx < 9; idx ++) {
            expect(await owner(hourai, idx)).to.equal(houraiStable.address.toLowerCase());
        }
        expect(await getRecipient(houraiStable)).to.equal(receiver1.address.toLowerCase());

        const okMinerC1 = await transferTokens(houraiStable, minerC1, [1,3]);
        expect(okMinerC1).to.equal(false);
        expect(await owner(hourai, 1)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 3)).to.equal(houraiStable.address.toLowerCase());
        const okMinerC2 = await transferTokens(houraiStable, minerC1, [5,6, 8]);
        expect(okMinerC2).to.equal(false);
        expect(await owner(hourai, 5)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 6)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 8)).to.equal(houraiStable.address.toLowerCase());

        await transferTokens(houraiStable, signer, [5,6,8]);
        await transferTokens(houraiStable, signer, [1,3,0]);
        expect(await owner(hourai, 0)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 1)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 3)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 5)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 6)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 8)).to.equal(receiver1.address.toLowerCase());

        await transferFrom(hourai.address, receiver1Pk, receiver1Addr, miner1.address, 1);
        // await hourai.connect(receiver1).safeTransferFrom(receiver1.address, miner1.address, 1);
        expect(await owner(hourai, 1)).to.equal(miner1.address.toLowerCase());
        await hourai.connect(miner1).setApprovalForAll(houraiStable.address, true);
        await stake(houraiStable, miner1, 1); // repeat stake
        expect(await owner(hourai, 1)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(houraiStable, 11)).to.equal(miner1.address.toLowerCase());
        expect(await getHourAiId(houraiStable, '11')).to.equal('1');


        await modifyRecipient(houraiStable, minerC1, receiver2.address)
        await modifyRecipient(houraiStable, miner2, receiver2.address)
        expect(await getRecipient(houraiStable)).to.equal(receiver1.address.toLowerCase());


        let ok = await transferTokens(houraiStable, signer, [1, 0, 9]);
        expect(ok).to.equal(false);
        expect(await owner(hourai, 0)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 1)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 9)).to.equal(houraiStable.address.toLowerCase());

        ok = await transferTokens(houraiStable, signer, [1, 9]);
        expect(ok).to.equal(true);
        expect(await owner(hourai, 1)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(hourai, 9)).to.equal(receiver1.address.toLowerCase());
        expect(await owner(houraiStable, 2)).to.equal(minerC1.address.toLowerCase());
        expect(await owner(houraiStable, 10)).to.equal(minerC2.address.toLowerCase());

        await transferFrom(hourai.address, receiver1Pk, receiver1Addr, miner2.address, 9);
        await transferFrom(hourai.address, receiver1Pk, receiver1Addr, miner2.address, 0);
        await transferFrom(hourai.address, receiver1Pk, receiver1Addr, miner3.address, 5);
        await transferFrom(hourai.address, receiver1Pk, receiver1Addr, miner3.address, 6);

        await hourai.connect(miner2).setApprovalForAll(houraiStable.address, true);
        await hourai.connect(miner3).setApprovalForAll(houraiStable.address, true);
        await stake(houraiStable, miner2, 0);
        await stake(houraiStable, miner2, 9);
        await stake(houraiStable, miner3, 5);
        await stake(houraiStable, miner3, 6);
        expect(await owner(hourai, 0)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 9)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 5)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(hourai, 6)).to.equal(houraiStable.address.toLowerCase());
        expect(await owner(houraiStable, 12)).to.equal(miner2.address.toLowerCase());
        expect(await owner(houraiStable, 13)).to.equal(miner2.address.toLowerCase());
        expect(await owner(houraiStable, 14)).to.equal(miner3.address.toLowerCase());
        expect(await owner(houraiStable, 15)).to.equal(miner3.address.toLowerCase());
        expect(await getHourAiId(houraiStable, '12')).to.equal('0');
        expect(await getHourAiId(houraiStable, '13')).to.equal('9');
        expect(await getHourAiId(houraiStable, '14')).to.equal('5');
        expect(await getHourAiId(houraiStable, '15')).to.equal('6');

        await modifyRecipient(houraiStable, signer, receiver2.address)
        expect(await getRecipient(houraiStable)).to.equal(receiver2.address.toLowerCase());

        ok = await transferTokens(houraiStable, signer, [0, 6]);
        expect(ok).to.equal(true);
        expect(await owner(hourai, 0)).to.equal(receiver2.address.toLowerCase());
        expect(await owner(hourai, 6)).to.equal(receiver2.address.toLowerCase());
    });

    
});