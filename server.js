const express = require('express');
const ethers = require('ethers');
const cors = require("cors");

const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const getUserCanAssignAddress = require('./lib/check_user_owns_address');
const getIssueIdFromUrl = require('./lib/issueUrlToId');

const rpcNode = process.env.RPC_NODE;
const openQAddress = process.env.OPENQ_ADDRESS;
const walletKey = process.env.WALLET_KEY;

const withdrawIssueDepositFunctionSignature = 'function withdrawIssueDeposit(string, address) public';
const registerUserFunctionSignature = 'function registerUserAddress(string, address) public';

const PORT = 8090;
const app = express();
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`OpenQ address is: ${openQAddress}`);
});

app.post('/withdraw', async (req, res) => {
    const { username, issueId, payoutAddress, oauthToken } = req.body;

    checkWithdrawalEligibility(username, issueId, oauthToken)
        .then(result => {
            const { canWithdraw, reason } = result;
            if (canWithdraw) {
                const provider = new ethers.providers.JsonRpcProvider(rpcNode);
                const wallet = new ethers.Wallet(walletKey, provider);
                const contract = new ethers.Contract(openQAddress, [withdrawIssueDepositFunctionSignature], provider);
                const contractWithWallet = contract.connect(wallet);
                const result = contractWithWallet.withdrawIssueDeposit(issueId, payoutAddress);
                res.statusCode = 200;
                res.send(result);
            } else {
                res.statusCode = 401;
                res.send(`User ${username} does not have permission to withdraw on issue ${issueId}`);
            }
        })
        .catch(error => {
            if (error.type == "NOT_FOUND") {
                res.statusCode = 404;
                return res.json(error);
            }
            if (error.type == "UNAUTHORIZED") {
                res.statusCode = 401;
                return res.json(error);
            }
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

app.post('/issueUrlToId', async (req, res) => {
    const { owner, repoName, number, oauthToken } = req.body;

    getIssueIdFromUrl(owner, repoName, number, oauthToken)
        .then(response => {
            res.send(response);
        })
        .catch(error => {
            res.send(error);
        });
});

app.listen(PORT);
console.log(`Listening on ${PORT}`);