const ethers = require('ethers');
const rpcNode = "https://ropsten.infura.io/v3/3b83a506f358431399e427135570f8e8";
const walletKey = process.env.WALLET_KEY;
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');

exports.handler = async (event) => {
    const canWithdraw = await checkWithdrawalEligibility(event.username, event.issueId);

    if (canWithdraw) {
        const provider = new ethers.providers.JsonRpcProvider(rpcNode);
        const wallet = new ethers.Wallet(walletKey, provider);
        const contract = new ethers.Contract('0x7b6aE374AF8818548e9835c0907C17A9551C0D34', ['function testFx(uint256) public returns(uint256)'], provider);
        const contractWithWallet = contract.connect(wallet);
        const result = contractWithWallet.testFx(200);
        return result;
    } else {
        return `User ${event.username} does not have permission to withdraw on issue ${event.issueId}`;
    }
};