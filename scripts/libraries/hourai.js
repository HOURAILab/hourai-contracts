const { getWeb3 } = require('./getWeb3');
const { getContractABI } = require('./getContractJson');

function getHourAi(address) {
    const path = __dirname + '/../../artifacts/contracts/HOURAI.sol/HOURAI.json';
    const hourAiABI = getContractABI(path);
    const web3 = getWeb3();

    const hourAi = new web3.eth.Contract(hourAiABI, address);
    return hourAi;
}


module.exports = {getHourAi};
