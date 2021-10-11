const express = require('express');
const ethers = require('ethers');
const cors = require("cors");

const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const getUserCanAssignAddress = require('./lib/check_user_owns_address');
const getIssueIdFromUrl = require('./lib/issueUrlToId');
const addresses = require('./addresses.json');

const providerUrl = process.env.PROVIDER_URL;
const openQAddress = addresses.OPENQ_ADDRESS;
const walletKey = process.env.WALLET_KEY;

const withdrawIssueDepositFunctionSignature = 'function claimBounty(string, address) public';
const registerUserFunctionSignature = 'function registerUserAddress(string, address) public';

const PORT = 8090;
const app = express();
app.use(cors());

app.use(express.json());
app.get('/', (req, res) => {
    res.send(`OpenQ address is: ${addresses.OPENQ_ADDRESS}`);
});

app.get('/env', (req, res) => {
    res.send(`${JSON.stringify(process.env.PROVIDER_URL)}`);
});

app.post('/withdraw', async (req, res) => {
    const { issueUrl, payoutAddress, oauthToken } = req.body;

    await checkWithdrawalEligibility(issueUrl, oauthToken)
        .then(async result => {
            const { canWithdraw, reason, type, issueId } = result;

            if (canWithdraw) {
                const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
                const wallet = new ethers.Wallet(walletKey, provider);
                const contract = new ethers.Contract(openQAddress, [withdrawIssueDepositFunctionSignature], provider);
                const contractWithWallet = contract.connect(wallet);
                const claimBountyResult = await contractWithWallet.claimBounty(issueId, payoutAddress);
                res.statusCode = 200;
                res.send("i worked");
            }
        })
        .catch(error => {
            const { type, reason } = error;
            switch (type) {
                case "NOT_FOUND":
                    res.statusCode = 404;
                    return res.json(error);
                case "NOT_CLOSED":
                    res.statusCode = 404;
                    return res.json(error);
                case "INVALID_OAUTH_TOKEN":
                    res.statusCode = 401;
                    return res.json(error);
                case "ISSUE_NOT_CLOSED_BY_USER":
                    res.statusCode = 401;
                    return res.json(error);
                case "ISSUE_NOT_CLOSED_BY_PR":
                    res.statusCode = 401;
                    return res.json(error);
                default:
                    return res.send(error.toString());
            }
        });
});

app.post('/register', async (req, res) => {
    const { username, oauthToken, address } = req.body;

    getUserCanAssignAddress(username, oauthToken, address)
        .then(canRegister => {
            if (canRegister) {
                const provider = new ethers.providers.JsonRpcProvider(providerUrl);
                const wallet = new ethers.Wallet(walletKey, provider);
                const contract = new ethers.Contract(openQAddress, [registerUserFunctionSignature], provider);
                const contractWithWallet = contract.connect(wallet);
                const result = contractWithWallet.registerUserAddress(username, address);
                console.log(result);
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
    const { issueUrl, token } = req.body;

    getIssueIdFromUrl(issueUrl, token)
        .then(response => {
            res.send(response);
        })
        .catch(error => {
            if (error == "NOT_FOUND") {
                res.statusCode = 404;
            }
            res.send(error);
        });
});

app.listen(PORT);
const env = {
    "OPENQ_ADDRESS": process.env.OPENQ_ADDRESS,
    "PROVIDER_URL": process.env.PROVIDER_URL,
    "WALLET_KEY": process.env.WALLET_KEY,
    "CHAIN_ID": process.env.CHAIN_ID
};
console.log(`Environment: ${JSON.stringify(env)}`);
console.log(`Listening on ${PORT}`);