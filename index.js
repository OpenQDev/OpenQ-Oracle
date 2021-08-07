const ethers = require('ethers');
const rpcNode = "https://ropsten.infura.io/v3/3b83a506f358431399e427135570f8e8";
const walletKey = process.env.WALLET_KEY;

exports.handler = async (event) => {
    const provider = new ethers.providers.JsonRpcProvider(rpcNode);
    const wallet = new ethers.Wallet(walletKey, provider);
    const contract = new ethers.Contract('0xe9C30fb9EB97c70A16bD2eed69AC08b3257c6640', ['function testFx(uint256) public returns(uint256)'], provider);
    const contractWithWallet = contract.connect(wallet);
    const result = contractWithWallet.testFx(16);
    return result;
};