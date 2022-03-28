
const { checkProperties } = require("@ethersproject/properties");
const { BigNumber } = require("bignumber.js");
const { expect } = require("chai");
const hardhat = require('hardhat');
const { ethers } = require("hardhat");;


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
        // console.log(err);
        ok = false;
    }
    return ok;
}

async function mintThroughCaller(caller, miner, value, quantity) {
    let ok = true;
    try {
        await caller.connect(miner).mint(quantity, {value});
    } catch (err) {
        ok = false;
    }
    return ok;
}

async function whiteListRemain(hourai, addr) {
    const remainType = (await hourai.whiteListRemainType(addr)).toString();
    return stringDiv(remainType, '8');
}

async function whiteListType(hourai, addr) {
    const remainType = (await hourai.whiteListRemainType(addr)).toString();
    return stringMod(remainType, '8');
}

async function publicSaleNum(hourai, addr) {
    return (await hourai.publicSaleNum(addr)).toString();
}

async function owner(hourai, tokenId) {
    let ok = true;
    let addr = '';
    try {
        addr = await hourai.ownerOf(tokenId);
    } catch(err) {
        // console.log(err);
        ok = false;
    }
    return {ok, addr}
}

async function mintNum(hourai) {
    return (await hourai.mintNum()).toString();
}

async function getBalance(addr) {
    return String(await ethers.provider.getBalance(addr));
}

describe("test uniswap price oracle", function () {

    var signer, minerA1, minerA2, minerA3, minerA4, minerA5, minerB1, minerB2, minerB3, minerC1, minerC2, miner1, miner2, miner3, receiver;
    var minerD1, minerD2, minerD3, minerD4, minerD5;
    var hourai;
    var caller;
    var hugeAmount;
    var timestampStart;
    var startTimeOfWhiteListMint;
    var startTimeOfPublicSale;

    var priceOfWhiteListMintABC;
    var priceOfWhiteListMintD;
    var priceOfPublicSale;

    var minerList;

    beforeEach(async function() {

        hugeAmount = '1000000000000000000000000000000';
      
        [
            signer,  
            minerA1, minerA2, minerA3, minerA4, minerA5, 
            minerB1, minerB2, minerB3, 
            minerC1, minerC2, 
            minerD1, minerD2, minerD3, minerD4, minerD5,
            miner1, miner2, miner3, 
            receiver
        ] = await ethers.getSigners();

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

        startTimeOfWhiteListMint = timestampStart + 160000;
        startTimeOfPublicSale = timestampStart + 500000;

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
            receiver.address
        );

        const callerFactory = await ethers.getContractFactory('HOURAICaller');
        caller = await callerFactory.deploy(hourai.address);

        await hourai.setWhiteListAddress([minerA1.address, minerA2.address, minerA3.address, minerA4.address, minerA5.address], 1);
        await hourai.setWhiteListAddress([minerB1.address, minerB2.address, minerB3.address], 2);
        await hourai.setWhiteListAddress([minerC1.address, minerC2.address, caller.address], 3);
        await hourai.setWhiteListAddress([minerD1.address, minerD2.address, minerD3.address, minerD4.address, minerD5.address], 4);
        
        minerList = [
            miner1, miner2, miner3, 
            minerA1, minerA2, minerA3, minerA4, minerA5,
            minerB1, minerB2, minerB3, minerC1, minerC2,
            minerD1, minerD2, minerD3, minerD4, minerD5,
        ];
    });

    it("mint", async function() {

        let totalEther = '0';
        
        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);
        const miner1Ok = await mint(hourai, miner1, priceOfWhiteListMintD, 1);
        expect(miner1Ok).to.equal(false);
        expect(await mintNum(hourai)).to.equal('0');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf0Ok_1, addr: ownerOf0_1} = await owner(hourai, '0');
        expect(ownerOf0Ok_1).to.equal(false);
        expect(ownerOf0_1.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, miner1.address)).to.equal('0');
        expect(await publicSaleNum(hourai, miner1.address)).to.equal('0');

        const minerA1Ok_2 = await mint(hourai, minerA1, priceOfWhiteListMintABC, 1);
        expect(minerA1Ok_2).to.equal(true);
        expect(await mintNum(hourai)).to.equal('1');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintABC)
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf0Ok_2, addr: ownerOf0_2} = await owner(hourai, '0');
        expect(ownerOf0Ok_2).to.equal(true);
        expect(ownerOf0_2.toLowerCase()).to.equal(minerA1.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerA1.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerA1.address)).to.equal('0');

        const minerA1Ok_3 = await mint(hourai, minerA1, priceOfWhiteListMintABC, 1);
        expect(minerA1Ok_3).to.equal(false);
        expect(await mintNum(hourai)).to.equal('1');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf1Ok_3, addr: ownerOf1_3} = await owner(hourai, '1');
        expect(ownerOf1Ok_3).to.equal(false);
        expect(ownerOf1_3.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, minerA1.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerA1.address)).to.equal('0');


        const minerA2Ok_4 = await mint(hourai, minerA2, priceOfWhiteListMintD, 1);
        expect(minerA2Ok_4).to.equal(true);
        expect(await mintNum(hourai)).to.equal('2');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintABC)
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf1Ok_4, addr: ownerOf1_4} = await owner(hourai, '1');
        expect(ownerOf1Ok_4).to.equal(true);
        expect(ownerOf1_4.toLowerCase()).to.equal(minerA2.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerA2.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerA2.address)).to.equal('0');


        const minerA3Ok_5 = await mint(hourai, minerA3, stringMinus(priceOfWhiteListMintABC, 1), 1);
        expect(minerA3Ok_5).to.equal(false);
        expect(await mintNum(hourai)).to.equal('2');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf3Ok_5, addr: ownerOf3_5} = await owner(hourai, '2');
        expect(ownerOf3Ok_5).to.equal(false);
        expect(ownerOf3_5.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, minerA3.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerA3.address)).to.equal('0');


        const minerA3Ok_6 = await mint(hourai, minerA3, stringMul(priceOfWhiteListMintABC, 2), 2);
        expect(minerA3Ok_6).to.equal(false);
        expect(await mintNum(hourai)).to.equal('2');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf3Ok_6, addr: ownerOf3_6} = await owner(hourai, '2');
        expect(ownerOf3Ok_6).to.equal(false);
        expect(ownerOf3_6.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, minerA3.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerA3.address)).to.equal('0');


        const minerA3Ok_7 = await mint(hourai, minerA3, priceOfWhiteListMintABC, 1);
        expect(minerA3Ok_7).to.equal(true);
        expect(await mintNum(hourai)).to.equal('3');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintABC)
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf3Ok_7, addr: ownerOf3_7} = await owner(hourai, '2');
        expect(ownerOf3Ok_7).to.equal(true);
        expect(ownerOf3_7.toLowerCase()).to.equal(minerA3.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerA3.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerA3.address)).to.equal('0');


        const minerA4Ok_8 = await mint(hourai, minerA3, priceOfWhiteListMintABC, 0);
        expect(minerA4Ok_8).to.equal(false);
        expect(await mintNum(hourai)).to.equal('3');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf3Ok_8, addr: ownerOf3_8} = await owner(hourai, '3');
        expect(ownerOf3Ok_8).to.equal(false);
        expect(ownerOf3_8.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, minerA4.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerA4.address)).to.equal('0');


        const minerB1Ok_9 = await mint(hourai, minerB1, priceOfWhiteListMintABC, 1);
        expect(minerB1Ok_9).to.equal(true);
        expect(await mintNum(hourai)).to.equal('4');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintABC);
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf3Ok_9, addr: ownerOf3_9} = await owner(hourai, '3');
        expect(ownerOf3Ok_9).to.equal(true);
        expect(ownerOf3_9.toLowerCase()).to.equal(minerB1.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerB1.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerB1.address)).to.equal('0');
        

        const minerB1Ok_10 = await mint(hourai, minerB1, stringMul(priceOfWhiteListMintABC, 2), 2);
        expect(minerB1Ok_10).to.equal(false);
        expect(await mintNum(hourai)).to.equal('4');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf4Ok_10, addr: ownerOf4_10} = await owner(hourai, '4');
        expect(ownerOf4Ok_10).to.equal(false);
        expect(ownerOf4_10.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, minerB1.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerB1.address)).to.equal('0');


        const minerB2Ok_11 = await mint(hourai, minerB2, stringMul(priceOfWhiteListMintABC, 2), 2);
        expect(minerB2Ok_11).to.equal(true);
        expect(await mintNum(hourai)).to.equal('6');
        totalEther = stringAdd(totalEther, stringMul(priceOfWhiteListMintABC, 2));
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf4Ok_11, addr: ownerOf4_11} = await owner(hourai, '4');
        expect(ownerOf4Ok_11).to.equal(true);
        expect(ownerOf4_11.toLowerCase()).to.equal(minerB2.address.toLowerCase());
        const {ok: ownerOf5Ok_11, addr: ownerOf5_11} = await owner(hourai, '5');
        expect(ownerOf5Ok_11).to.equal(true);
        expect(ownerOf5_11.toLowerCase()).to.equal(minerB2.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerB2.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerB2.address)).to.equal('0');


        const minerB3Ok_12 = await mint(hourai, minerB3, priceOfWhiteListMintD, 1);
        expect(minerB3Ok_12).to.equal(true);
        expect(await mintNum(hourai)).to.equal('7');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintABC);
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf6Ok, addr: ownerOf6} = await owner(hourai, '6');
        expect(ownerOf6Ok).to.equal(true);
        expect(ownerOf6.toLowerCase()).to.equal(minerB3.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerB3.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerB3.address)).to.equal('0');
        
        const minerB3Ok_13 = await mint(hourai, minerB3, priceOfPublicSale, 1);
        expect(minerB3Ok_13).to.equal(true);
        expect(await mintNum(hourai)).to.equal('8');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintABC);
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf7Ok, addr: ownerOf7} = await owner(hourai, '7');
        expect(ownerOf7Ok).to.equal(true);
        expect(ownerOf7.toLowerCase()).to.equal(minerB3.address.toLowerCase());
        expect(await whiteListRemain(hourai, minerB3.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerB3.address)).to.equal('0');

        const minerB3Ok_14 = await mint(hourai, minerB3, priceOfPublicSale, 1);
        expect(minerB3Ok_14).to.equal(false);
        expect(await mintNum(hourai)).to.equal('8');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        const {ok: ownerOf8Ok, addr: ownerOf8} = await owner(hourai, '8');
        expect(ownerOf8Ok).to.equal(false);
        expect(ownerOf8.toLowerCase()).to.equal('');
        expect(await whiteListRemain(hourai, minerB3.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerB3.address)).to.equal('0');

        // contract can not mint!
        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            let mintOk = await mintThroughCaller(caller, miner, priceOfPublicSale, 1);
            expect(mintOk).to.equal(false);
            mintOk = await mintThroughCaller(caller, miner, priceOfWhiteListMintABC, 1);
            expect(mintOk).to.equal(false);
            mintOk = await mintThroughCaller(caller, miner, priceOfWhiteListMintD, 1);
            expect(mintOk).to.equal(false);
            expect(await mintNum(hourai)).to.equal('8');
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(8));
                expect(ownerOf.ok).to.equal(false);
                expect(ownerOf.addr.toLowerCase()).to.equal('');
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('0');
            expect(await whiteListRemain(hourai, caller.address)).to.equal('10');
            expect(await publicSaleNum(hourai, caller.address)).to.equal('0');
        }
        

        const minerC1Ok_15 = await mint(hourai, minerC1, stringMul(priceOfPublicSale, 6), 6);
        expect(minerC1Ok_15).to.equal(true);
        expect(await mintNum(hourai)).to.equal('14');
        totalEther = stringAdd(totalEther, stringMul(priceOfWhiteListMintABC, 6));
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        for (let idx = 8; idx < 14; idx ++) {
            const ownerOf = await owner(hourai, String(idx));
            expect(ownerOf.ok).to.equal(true);
            expect(ownerOf.addr.toLowerCase()).to.equal(minerC1.address.toLowerCase());
        }
        expect(await whiteListRemain(hourai, minerC1.address)).to.equal('4');
        expect(await publicSaleNum(hourai, minerC1.address)).to.equal('0');

        const minerC1Ok_16 = await mint(hourai, minerC1, stringMinus(stringMul(priceOfWhiteListMintABC, 4), 1), 4);
        expect(minerC1Ok_16).to.equal(false);
        expect(await mintNum(hourai)).to.equal('14');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        for (let idx = 14; idx < 18; idx ++) {
            const ownerOf = await owner(hourai, String(idx));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, minerC1.address)).to.equal('4');
        expect(await publicSaleNum(hourai, minerC1.address)).to.equal('0');

        const minerC1Ok_17 = await mint(hourai, minerC1, stringMul(priceOfWhiteListMintABC, 5), 5);
        expect(minerC1Ok_17).to.equal(false);
        expect(await mintNum(hourai)).to.equal('14');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        for (let idx = 14; idx < 19; idx ++) {
            const ownerOf = await owner(hourai, String(idx));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, minerC1.address)).to.equal('4');
        expect(await publicSaleNum(hourai, minerC1.address)).to.equal('0');

        const minerC1Ok_18 = await mint(hourai, minerC1, stringMul(priceOfWhiteListMintABC, 4), 4);
        expect(minerC1Ok_18).to.equal(true);
        expect(await mintNum(hourai)).to.equal('18');
        totalEther = stringAdd(totalEther, stringMul(priceOfWhiteListMintABC, 4));
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        for (let idx = 14; idx < 18; idx ++) {
            const ownerOf = await owner(hourai, String(idx));
            expect(ownerOf.ok).to.equal(true);
            expect(ownerOf.addr.toLowerCase()).to.equal(minerC1.address.toLowerCase());
        }
        expect(await whiteListRemain(hourai, minerC1.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerC1.address)).to.equal('0');

        const minerD1Ok_19 = await mint(hourai, minerD1, priceOfWhiteListMintD, 1);
        expect(minerD1Ok_19).to.equal(true);
        expect(await mintNum(hourai)).to.equal('19');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintD);
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(18));
            expect(ownerOf.ok).to.equal(true);
            expect(ownerOf.addr.toLowerCase()).to.equal(minerD1.address.toLowerCase());
        }
        expect(await whiteListRemain(hourai, minerD1.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerD1.address)).to.equal('0');

        const minerD1Ok_20 = await mint(hourai, minerD1, priceOfWhiteListMintD, 1);
        expect(minerD1Ok_20).to.equal(false);
        expect(await mintNum(hourai)).to.equal('19');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(19));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, minerD1.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerD1.address)).to.equal('0');

        const minerD2Ok_21 = await mint(hourai, minerD2, stringMul(priceOfWhiteListMintD, 2), 2);
        expect(minerD2Ok_21).to.equal(false);
        expect(await mintNum(hourai)).to.equal('19');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        for (let idx = 19; idx < 21; idx ++) {
            const ownerOf = await owner(hourai, String(idx));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, minerD2.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerD2.address)).to.equal('0');


        const minerD3Ok_22 = await mint(hourai, minerD3, priceOfWhiteListMintABC, 1);
        expect(minerD3Ok_22).to.equal(false);
        expect(await mintNum(hourai)).to.equal('19');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(19));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, minerD3.address)).to.equal('1');
        expect(await publicSaleNum(hourai, minerD3.address)).to.equal('0');


        const minerD4Ok_23 = await mint(hourai, minerD4, priceOfWhiteListMintD, 1);
        expect(minerD4Ok_23).to.equal(true);
        expect(await mintNum(hourai)).to.equal('20');
        totalEther = stringAdd(totalEther, priceOfWhiteListMintD);
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(19));
            expect(ownerOf.ok).to.equal(true);
            expect(ownerOf.addr.toLowerCase()).to.equal(minerD4.address.toLowerCase());
        }
        expect(await whiteListRemain(hourai, minerD4.address)).to.equal('0');
        expect(await publicSaleNum(hourai, minerD4.address)).to.equal('0');


        const miner2Ok_24 = await mint(hourai, miner2, priceOfWhiteListMintABC, 1);
        expect(miner2Ok_24).to.equal(false);
        expect(await mintNum(hourai)).to.equal('20');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(20));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, miner2.address)).to.equal('0');
        expect(await publicSaleNum(hourai, miner2.address)).to.equal('0');


        const miner2Ok_25 = await mint(hourai, miner2, priceOfPublicSale, 1);
        expect(miner2Ok_25).to.equal(false);
        expect(await mintNum(hourai)).to.equal('20');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(20));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, miner2.address)).to.equal('0');
        expect(await publicSaleNum(hourai, miner2.address)).to.equal('0');


        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfPublicSale + 18]);

        const miner2Ok_26 = await mint(hourai, miner2, priceOfWhiteListMintD, 1);
        expect(miner2Ok_26).to.equal(false);
        expect(await mintNum(hourai)).to.equal('20');
        expect(await getBalance(hourai.address)).to.equal(totalEther);
        {
            const ownerOf = await owner(hourai, String(20));
            expect(ownerOf.ok).to.equal(false);
            expect(ownerOf.addr.toLowerCase()).to.equal('');
        }
        expect(await whiteListRemain(hourai, miner2.address)).to.equal('0');
        expect(await publicSaleNum(hourai, miner2.address)).to.equal('0');


        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            const mintOk = await mint(hourai, miner, stringMul(priceOfPublicSale, '2'), 2);
            expect(mintOk).to.equal(false);
            expect(await mintNum(hourai)).to.equal('20');
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(20));
                expect(ownerOf.ok).to.equal(false);
                expect(ownerOf.addr.toLowerCase()).to.equal('');
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('0');
        }

        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            const mintOk = await mint(hourai, miner, priceOfWhiteListMintD, 1);
            expect(mintOk).to.equal(false);
            expect(await mintNum(hourai)).to.equal('20');
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(20));
                expect(ownerOf.ok).to.equal(false);
                expect(ownerOf.addr.toLowerCase()).to.equal('');
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('0');
        }

        // contract can not mint!
        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            let mintOk = await mintThroughCaller(caller, miner, priceOfPublicSale, 1);
            expect(mintOk).to.equal(false);
            mintOk = await mintThroughCaller(caller, miner, priceOfWhiteListMintABC, 1);
            expect(mintOk).to.equal(false);
            mintOk = await mintThroughCaller(caller, miner, priceOfWhiteListMintD, 1);
            expect(mintOk).to.equal(false);
            expect(await mintNum(hourai)).to.equal('20');
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(20));
                expect(ownerOf.ok).to.equal(false);
                expect(ownerOf.addr.toLowerCase()).to.equal('');
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('0');
            expect(await whiteListRemain(hourai, caller.address)).to.equal('10');
            expect(await publicSaleNum(hourai, caller.address)).to.equal('0');
        }

        let hasMintNum = 20;
        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            const mintOk = await mint(hourai, miner, priceOfPublicSale, 1);
            expect(mintOk).to.equal(true);
            hasMintNum += 1;
            expect(await mintNum(hourai)).to.equal(String(hasMintNum));
            totalEther = stringAdd(totalEther, priceOfPublicSale);
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(hasMintNum - 1));
                expect(ownerOf.ok).to.equal(true);
                expect(ownerOf.addr.toLowerCase()).to.equal(miner.address.toLowerCase());
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('1');
        }
        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            const mintOk = await mint(hourai, miner, priceOfPublicSale, 1);
            expect(mintOk).to.equal(false);
            expect(await mintNum(hourai)).to.equal(String(hasMintNum));
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(hasMintNum));
                expect(ownerOf.ok).to.equal(false);
                expect(ownerOf.addr.toLowerCase()).to.equal('');
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('1');
        }

        // contract can not mint!
        for (const miner of minerList) {
            const whiteListRemainBefore = await whiteListRemain(hourai, miner.address);
            let mintOk = await mintThroughCaller(caller, miner, priceOfPublicSale, 1);
            expect(mintOk).to.equal(false);
            mintOk = await mintThroughCaller(caller, miner, priceOfWhiteListMintABC, 1);
            expect(mintOk).to.equal(false);
            mintOk = await mintThroughCaller(caller, miner, priceOfWhiteListMintD, 1);
            expect(mintOk).to.equal(false);
            expect(await mintNum(hourai)).to.equal(String(hasMintNum));
            expect(await getBalance(hourai.address)).to.equal(totalEther);
            {
                const ownerOf = await owner(hourai, String(hasMintNum));
                expect(ownerOf.ok).to.equal(false);
                expect(ownerOf.addr.toLowerCase()).to.equal('');
            }
            expect(await whiteListRemain(hourai, miner.address)).to.equal(whiteListRemainBefore);
            expect(await publicSaleNum(hourai, miner.address)).to.equal('1');
            expect(await whiteListRemain(hourai, caller.address)).to.equal('10');
            expect(await publicSaleNum(hourai, caller.address)).to.equal('0');
        }
    });
    
});