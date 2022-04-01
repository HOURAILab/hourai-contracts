
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

async function collectEther(hourai, receiver) {

    let ok = true;
    const balanceBefore = (await ethers.provider.getBalance(receiver.address)).toString();
    try {
        await hourai.connect(receiver).collectEther();
    } catch(err) {
        ok = false;
    }
    const balanceAfter = (await ethers.provider.getBalance(receiver.address)).toString();
    return {ok, delta: stringMinus(balanceAfter, balanceBefore)};
}

async function sendEther(hourai, owner, receiver) {

    let ok = true;
    const balanceBefore = (await ethers.provider.getBalance(receiver.address)).toString();
    try {
        await hourai.connect(owner).sendEther();
    } catch(err) {
        // console.log(err);
        ok = false;
    }
    const balanceAfter = (await ethers.provider.getBalance(receiver.address)).toString();
    return {ok, delta: stringMinus(balanceAfter, balanceBefore)};
}

async function reservedMintFor(hourai, owner, recipientAddress, quantity) {

    let ok = true;
    try {
        await hourai.connect(owner).reservedMintFor(quantity, recipientAddress);
    } catch(err) {
        // console.log(err);
        ok = false;
    }
    return ok;
}

async function reservedMintNum(hourai) {
    return (await hourai.reservedMintNum()).toString();
}
async function expectGt(a, b) {
    expect(BigNumber(a).gt(b)).to.equal(true);
}
async function getEthReceiver(hourai) {
    return await hourai.ethReceiver();
}

async function modifyEnable(hourai, owner, enable) {

    let ok = true;
    try {
        await hourai.connect(owner).modifyEnable(enable);
    } catch(err) {
        ok = false;
    }
    return ok;
}

async function modifyStartTimeOfWhiteListMint(hourai, owner, timestamp) {
    
    let ok = true;
    try {
        await hourai.connect(owner).modifyStartTimeOfWhiteListMint(timestamp);
    } catch(err) {
        // console.log(err);
        ok = false;
    }
    return ok;
}

async function getStartTimeOfWhiteListMint(hourai) {
    return (await hourai.config()).startTimeOfWhiteListMint.toString();
}

async function getStartTimeOfPublicSale(hourai) {
    return (await hourai.config()).startTimeOfPublicSale.toString();
}
async function modifyStartTimeOfPublicSale(hourai, owner, timestamp) {
    
    let ok = true;
    try {
        await hourai.connect(owner).modifyStartTimeOfPublicSale(timestamp);
    } catch(err) {
        ok = false;
    }
    return ok;
}

async function getEnable(hourai) {
    return await hourai.enable();
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
    return {ok, addr: addr.toLowerCase()}
}

async function mintNum(hourai) {
    return (await hourai.mintNum()).toString();
}

async function getBalance(addr) {
    return String(await ethers.provider.getBalance(addr));
}

describe("test uniswap price oracle", function () {

    var signer, minerC1, minerC2, minerC3, minerC4, minerC5, minerC6, minerC7, minerC8, miner1, miner2, miner3;
    var receiver1, receiver2;
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
            minerC1, minerC2, minerC3, minerC4, minerC5, minerC6, minerC7, minerC8,
            miner1, miner2, miner3, 
            receiver1, receiver2
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

        startTimeOfWhiteListMint = timestampStart + 160000000;
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
            receiver1.address
        );

        const callerFactory = await ethers.getContractFactory('HOURAICaller');
        caller = await callerFactory.deploy(hourai.address);

        await hourai.setWhiteListAddress([minerC1.address, minerC2.address, minerC3.address, minerC4.address, minerC5.address, minerC6.address, minerC7.address, minerC8.address], 3);
        
    });

    it("base uri", async function() {

        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);

        await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);

        await mint(hourai, minerC2, priceOfWhiteListMintABC, 1);
        
        console.log(await tokenURI(hourai, '0'));
        console.log(await tokenURI(hourai, '1'));

        const okMiner1 = await setBaseURI(hourai, miner1, 'www.google.com/');
        expect(okMiner1).to.equal(false);

        console.log(await tokenURI(hourai, '0'));
        console.log(await tokenURI(hourai, '1'));

        const okOwner = await setBaseURI(hourai, signer, 'www.sogou.com/');
        expect(okOwner).to.equal(true);

        console.log(await tokenURI(hourai, '0'));
        console.log(await tokenURI(hourai, '1'));
    });

    it ("collect ether", async function() {
        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);

        // phase 1
        await mint(hourai, minerC1, stringMul(priceOfWhiteListMintABC, 10), 10);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        
        expect((await getEthReceiver(hourai)).toLowerCase()).to.equal(receiver1.address.toLowerCase());

        const receiver2_1 = await collectEther(hourai, receiver2);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(receiver2_1.ok).to.equal(false);
        expectGt('0', receiver2_1.delta);

        const minerC1_1 = await collectEther(hourai, minerC1);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(minerC1_1.ok).to.equal(false);
        expectGt('0', minerC1_1.delta);

        const signer_1 = await collectEther(hourai, minerC1);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(signer_1.ok).to.equal(false);
        expectGt('0', signer_1.delta);

        const receiver1_1 = await collectEther(hourai, receiver1);

        expect(await getBalance(hourai.address)).to.equal('0');
        expect(receiver1_1.ok).to.equal(true);
        expectGt(receiver1_1.delta, '1190000000000000000');

        // phase 2
        await mint(hourai, minerC2, stringMul(priceOfWhiteListMintABC, 10), 10);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        const receiver2_2 = await collectEther(hourai, receiver2);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(receiver2_2.ok).to.equal(false);
        expectGt('0', receiver2_2.delta);

        const minerC1_2 = await collectEther(hourai, minerC1);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(minerC1_2.ok).to.equal(false);
        expectGt('0', minerC1_2.delta);

        const signer_2 = await collectEther(hourai, minerC1);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(signer_2.ok).to.equal(false);
        expectGt('0', signer_2.delta);

        const receiver1_2 = await collectEther(hourai, receiver1);

        expect(await getBalance(hourai.address)).to.equal('0');
        expect(receiver1_2.ok).to.equal(true);
        expectGt(receiver1_2.delta, '1190000000000000000');

    });


    it ("send ether", async function() {
        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);

        // phase 1
        await mint(hourai, minerC1, stringMul(priceOfWhiteListMintABC, 10), 10);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        
        expect((await getEthReceiver(hourai)).toLowerCase()).to.equal(receiver1.address.toLowerCase());

        const receiver2_1 = await sendEther(hourai, receiver2, receiver1);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(receiver2_1.ok).to.equal(false);
        expect(receiver2_1.delta).to.equal('0');

        const minerC1_1 = await sendEther(hourai, minerC1, receiver2);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(minerC1_1.ok).to.equal(false);
        expect(minerC1_1.delta).to.equal('0');

        const minerC2_1 = await sendEther(hourai, minerC2, minerC2);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(minerC2_1.ok).to.equal(false);
        expectGt('0', minerC2_1.delta);

        const signer_1 = await sendEther(hourai, signer, receiver1);

        expect(await getBalance(hourai.address)).to.equal('0');
        expect(signer_1.ok).to.equal(true);
        expect(signer_1.delta).to.equal('1200000000000000000');

        // phase 2
        await mint(hourai, minerC3, stringMul(priceOfWhiteListMintABC, 10), 10);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        
        expect((await getEthReceiver(hourai)).toLowerCase()).to.equal(receiver1.address.toLowerCase());

        const receiver2_2 = await sendEther(hourai, receiver2, receiver1);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(receiver2_2.ok).to.equal(false);
        expect(receiver2_2.delta).to.equal('0');

        const minerC1_2 = await sendEther(hourai, minerC1, receiver2);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(minerC1_2.ok).to.equal(false);
        expect(minerC1_2.delta).to.equal('0');

        const minerC2_2 = await sendEther(hourai, minerC2, minerC2);

        expect(await getBalance(hourai.address)).to.equal('1200000000000000000');
        expect(minerC2_2.ok).to.equal(false);
        expectGt('0', minerC2_2.delta);

        const signer_2 = await sendEther(hourai, signer, receiver1);

        expect(await getBalance(hourai.address)).to.equal('0');
        expect(signer_2.ok).to.equal(true);
        expect(signer_2.delta).to.equal('1200000000000000000');

    });

    it ("reserved mint for", async function() {
        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);

        // phase 1
        await mint(hourai, minerC1, stringMul(priceOfWhiteListMintABC, 10), 10);
        await mint(hourai, minerC2, stringMul(priceOfWhiteListMintABC, 6), 6);

        for (let idx = 0; idx < 10; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(minerC1.address.toLowerCase());
        }

        for (let idx = 10; idx < 16; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(minerC2.address.toLowerCase());
        }

        await reservedMintFor(hourai, signer, miner1.address, 25);
        expect(await reservedMintNum(hourai)).to.equal('25');

        for (let idx = 16; idx < 41; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(miner1.address.toLowerCase());
        }
        // other try to reserve
        const okMiner2_1 = await reservedMintFor(hourai, miner2, miner3.address, 20);
        expect(okMiner2_1).to.equal(false);
        expect(await reservedMintNum(hourai)).to.equal('25');
        const okMiner2_2 = await reservedMintFor(hourai, miner2, miner2.address, 21);
        expect(okMiner2_2).to.equal(false);
        expect(await reservedMintNum(hourai)).to.equal('25');

        for (let idx = 41; idx < 100; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(false);
            expect(ownerAddr).to.equal('');
        }

        await reservedMintFor(hourai, signer, miner3.address, 30);

        await reservedMintFor(hourai, signer, minerC1.address, 30);
        for (let idx = 41; idx < 71; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(miner3.address.toLowerCase());
        }
        for (let idx = 71; idx < 101; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(minerC1.address.toLowerCase());
        }
        expect(await reservedMintNum(hourai)).to.equal('85');

        const tryReserveMoreForMiner2 = await reservedMintFor(hourai, signer, miner2.address, 516);
        expect(tryReserveMoreForMiner2).to.equal(false);
        const tryReserveMoreForMiner1 = await reservedMintFor(hourai, signer, miner1.address, 516);
        expect(tryReserveMoreForMiner1).to.equal(false);
        const tryReserveMoreForMiner3 = await reservedMintFor(hourai, signer, miner3.address, 516);
        expect(tryReserveMoreForMiner3).to.equal(false);
        const tryReserveMoreForMinerC1 = await reservedMintFor(hourai, signer, minerC1.address, 516);
        expect(tryReserveMoreForMinerC1).to.equal(false);
        const tryReserveMoreForMinerC2 = await reservedMintFor(hourai, signer, minerC2.address, 516);
        expect(tryReserveMoreForMinerC2).to.equal(false);
        const tryReserveMoreForMinerC3 = await reservedMintFor(hourai, signer, minerC3.address, 516);
        expect(tryReserveMoreForMinerC3).to.equal(false);
        expect(await reservedMintNum(hourai)).to.equal('85');


        const reserveAllForMiner3 = await reservedMintFor(hourai, signer, miner1.address, 515);
        expect(reserveAllForMiner3).to.equal(true);
        expect(await reservedMintNum(hourai)).to.equal('600');
        for (let idx = 101; idx < 616; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(miner1.address.toLowerCase());
        }

        //check before
        for (let idx = 0; idx < 10; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(minerC1.address.toLowerCase());
        }

        for (let idx = 10; idx < 16; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(minerC2.address.toLowerCase());
        }
        for (let idx = 16; idx < 41; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(miner1.address.toLowerCase());
        }
        for (let idx = 41; idx < 71; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(miner3.address.toLowerCase());
        }
        for (let idx = 71; idx < 101; idx ++) {
            const {ok, addr: ownerAddr} = await owner(hourai, idx);
            expect(ok).to.equal(true);
            expect(ownerAddr).to.equal(minerC1.address.toLowerCase());
        }
    });


    it("modify enable", async function() {

        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfWhiteListMint + 18]);

        await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);

        expect(await mintNum(hourai)).to.equal('1');

        // others fail to change
        await modifyEnable(hourai, minerC1, false);
        await modifyEnable(hourai, receiver1, false);
        await modifyEnable(hourai, minerC2, false);
        expect(await getEnable(hourai)).to.equal(true);

        const ok2 = await mint(hourai, minerC2, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('2');
        expect(ok2).to.equal(true);

        await modifyEnable(hourai, signer, false);
        expect(await getEnable(hourai)).to.equal(false);
        const ok3 = await mint(hourai, minerC3, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('2');
        expect(ok3).to.equal(false);

        await modifyEnable(hourai, minerC1, true);
        await modifyEnable(hourai, receiver1, true);
        await modifyEnable(hourai, minerC2, true);
        expect(await getEnable(hourai)).to.equal(false);
        const ok4 = await mint(hourai, minerC4, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('2');
        expect(ok4).to.equal(false);

        await modifyEnable(hourai, signer, true);
        expect(await getEnable(hourai)).to.equal(true);
        const ok5 = await mint(hourai, minerC5, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('3');
        expect(ok5).to.equal(true);

        await ethers.provider.send('evm_setNextBlockTimestamp', [startTimeOfPublicSale + 18]);

        expect(await getEnable(hourai)).to.equal(true);
        const ok1_pub = await mint(hourai, minerC1, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('4');
        expect(ok1_pub).to.equal(true);


        await modifyEnable(hourai, minerC1, false);
        await modifyEnable(hourai, receiver1, false);
        await modifyEnable(hourai, minerC2, false);
        expect(await getEnable(hourai)).to.equal(true);

        const ok2_pub = await mint(hourai, minerC2, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('5');
        expect(ok2_pub).to.equal(true);

        await modifyEnable(hourai, signer, false);
        expect(await getEnable(hourai)).to.equal(false);
        const ok3_pub = await mint(hourai, minerC3, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('5');
        expect(ok3_pub).to.equal(false);

        await modifyEnable(hourai, minerC1, true);
        await modifyEnable(hourai, receiver1, true);
        await modifyEnable(hourai, minerC2, true);
        expect(await getEnable(hourai)).to.equal(false);
        const ok4_pub = await mint(hourai, minerC4, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('5');
        expect(ok4_pub).to.equal(false);

        await modifyEnable(hourai, signer, true);
        expect(await getEnable(hourai)).to.equal(true);
        const ok5_pub = await mint(hourai, minerC5, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('6');
        expect(ok5_pub).to.equal(true);
    });


    it("modify start time", async function() {

        await ethers.provider.send('evm_setNextBlockTimestamp', [timestampStart + 100]);
        expect(await getStartTimeOfWhiteListMint(hourai)).to.equal(String(startTimeOfWhiteListMint));

        const ok1 = await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('0');
        expect(ok1).to.equal(false);

        await modifyStartTimeOfWhiteListMint(hourai, miner1, timestampStart + 200);
        await modifyStartTimeOfWhiteListMint(hourai, minerC1, timestampStart + 200);
        await modifyStartTimeOfWhiteListMint(hourai, receiver1, timestampStart + 200);
        await modifyStartTimeOfWhiteListMint(hourai, minerC2, timestampStart + 200);
        expect(await getStartTimeOfWhiteListMint(hourai)).to.equal(String(startTimeOfWhiteListMint));

        await ethers.provider.send('evm_setNextBlockTimestamp', [timestampStart + 200]);

        const ok2 = await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('0');
        expect(ok2).to.equal(false);

        await modifyStartTimeOfWhiteListMint(hourai, signer, timestampStart + 300);
        expect(await getStartTimeOfWhiteListMint(hourai)).to.equal(String(timestampStart + 300));
        await ethers.provider.send('evm_setNextBlockTimestamp', [timestampStart + 301]);
        const ok3 = await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('1');
        expect(ok3).to.equal(true);


        await modifyStartTimeOfPublicSale(hourai, miner1, timestampStart + 1000);
        await modifyStartTimeOfPublicSale(hourai, minerC1, timestampStart + 1000);
        await modifyStartTimeOfPublicSale(hourai, receiver1, timestampStart + 1000);
        await modifyStartTimeOfPublicSale(hourai, minerC2, timestampStart + 1000);
        expect(await getStartTimeOfPublicSale(hourai)).to.equal(String(startTimeOfPublicSale));

        await ethers.provider.send('evm_setNextBlockTimestamp', [timestampStart + 1001]);
        const ok4 = await mint(hourai, miner2, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('1');
        expect(ok4).to.equal(false);
        const ok5 = await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('2');
        expect(ok5).to.equal(true);


        await modifyStartTimeOfPublicSale(hourai, signer, timestampStart + 999);
        expect(await getStartTimeOfPublicSale(hourai)).to.equal(String(startTimeOfPublicSale));
        await ethers.provider.send('evm_setNextBlockTimestamp', [timestampStart + 1500]);
        const ok6 = await mint(hourai, miner2, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('2');
        expect(ok6).to.equal(false);
        const ok7 = await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('3');
        expect(ok7).to.equal(true);

        await modifyStartTimeOfPublicSale(hourai, signer, timestampStart + 2000);
        expect(await getStartTimeOfPublicSale(hourai)).to.equal(String(timestampStart + 2000));
        await ethers.provider.send('evm_setNextBlockTimestamp', [timestampStart + 2001]);
        const ok8 = await mint(hourai, miner2, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('4');
        expect(ok8).to.equal(true);
        const ok9 = await mint(hourai, minerC1, priceOfWhiteListMintABC, 1);
        expect(await mintNum(hourai)).to.equal('4');
        expect(ok9).to.equal(false);
        const ok10 = await mint(hourai, minerC1, priceOfPublicSale, 1);
        expect(await mintNum(hourai)).to.equal('5');
        expect(ok10).to.equal(true);
    });
    
});