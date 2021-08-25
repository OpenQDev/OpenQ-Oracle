const ethers = require('ethers');
const rpcNode = "https://rinkeby.infura.io/v3/3b83a506f358431399e427135570f8e8";
const walletKey = process.env.WALLET_KEY;
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const openQAddress = '0x0843199D7D29b072e251BC9d828482857698B97B';
const withdrawIssueDepositFunctionSignature = 'function withdrawIssueDeposit(string, address) public';

exports.handler = async (event) => {
    const canWithdraw = await checkWithdrawalEligibility(event.username, event.issueId, event.oauthToken);

    if (canWithdraw) {
        const provider = new ethers.providers.JsonRpcProvider(rpcNode);
        const wallet = new ethers.Wallet(walletKey, provider);
        const contract = new ethers.Contract(openQAddress, [withdrawIssueDepositFunctionSignature], provider);
        const contractWithWallet = contract.connect(wallet);
        const result = contractWithWallet.withdrawIssueDeposit(event.issueId, event.payoutAddress);
        return result;
    } else {
        return `User ${event.username} does not have permission to withdraw on issue ${event.issueId}`;
    }
};