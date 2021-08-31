const express = require('express');
const ethers = require('ethers');
const rpcNode = "https://rinkeby.infura.io/v3/3b83a506f358431399e427135570f8e8";
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const withdrawIssueDepositFunctionSignature = 'function withdrawIssueDeposit(string, string) public';

const openQAddress = '0xB9479f72a819ca7DC03552a19EE4BE7fD7000B5d';
const walletKey = process.env.WALLET_KEY;

// Constants
const PORT = 8090;

// App
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('OK');
});

app.post('/withdraw', async (req, res) => {
    const { username, issueId, oauthToken } = req.body;

    checkWithdrawalEligibility(username, issueId, oauthToken)
        .then(canWithdraw => {
            if (canWithdraw) {
                const provider = new ethers.providers.JsonRpcProvider(rpcNode);
                const wallet = new ethers.Wallet(walletKey, provider);
                const contract = new ethers.Contract(openQAddress, [withdrawIssueDepositFunctionSignature], provider);
                const contractWithWallet = contract.connect(wallet);
                const result = contractWithWallet.withdrawIssueDeposit(issueId, username);
                res.send(result);
            } else {
                res.send(`User ${username} does not have permission to withdraw on issue ${issueId}`);
            }
        })
        .catch(error => {
            res.send(error);
        });
});

app.listen(PORT);
console.log(`Listening on ${PORT}`);