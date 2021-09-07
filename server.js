const express = require('express');
const ethers = require('ethers');
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const withdrawIssueDepositFunctionSignature = 'function withdrawIssueDeposit(string, string) public';

const rpcNode = process.env.RPC_NODE;
const openQAddress = process.env.OPENQ_ADDRESS;
const walletKey = process.env.WALLET_KEY;

const registerUserFunctionSignature = 'function registerUserAddress(string, address) public';
const getUserCanAssignAddress = require('./lib/check_user_owns_address');

const PORT = 8090;
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`OpenQ address is: ${openQAddress}`);
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

app.post('/register', async (req, res) => {
    const { username, oauthToken, address } = req.body;

    getUserCanAssignAddress(username, oauthToken, address)
        .then(canRegister => {
            if (canRegister) {
                const provider = new ethers.providers.JsonRpcProvider(rpcNode);
                const wallet = new ethers.Wallet(walletKey, provider);
                const contract = new ethers.Contract(openQAddress, [registerUserFunctionSignature], provider);
                const contractWithWallet = contract.connect(wallet);
                const result = contractWithWallet.registerUserAddress(username, address);
                res.send(result);
            } else {
                res.send(`User ${username} does not have permission to register address ${address}.`);
            }
        })
        .catch(error => {
            res.send(error);
        });
});

app.listen(PORT);
console.log(`Listening on ${PORT}`);