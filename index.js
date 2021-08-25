const ethers = require('ethers');
const rpcNode = "https://rinkeby.infura.io/v3/3b83a506f358431399e427135570f8e8";
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const withdrawIssueDepositFunctionSignature = 'function withdrawIssueDeposit(string, string) public';

const openQAddress = '0xB9479f72a819ca7DC03552a19EE4BE7fD7000B5d';
const walletKey = process.env.WALLET_KEY;

exports.handler = async (event) => {
    const canWithdraw = await checkWithdrawalEligibility(event.username, event.issueId, event.oauthToken);

    if (canWithdraw) {
        const provider = new ethers.providers.JsonRpcProvider(rpcNode);
        const wallet = new ethers.Wallet(walletKey, provider);
        const contract = new ethers.Contract(openQAddress, [withdrawIssueDepositFunctionSignature], provider);
        const contractWithWallet = contract.connect(wallet);
        const result = contractWithWallet.withdrawIssueDeposit(event.issueId, event.username);
        return result;
    } else {
        return `User ${event.username} does not have permission to withdraw on issue ${event.issueId}`;
    }
};