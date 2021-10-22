const express = require('express');
const ethers = require('ethers');
const cors = require("cors");
const cookieParser = require('cookie-parser');

// Helper methods
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const getUserCanAssignAddress = require('./lib/check_user_owns_address');
const getIssueIdFromUrl = require('./lib/issueUrlToId');

// Setup environment
require("dotenv").config();
const addresses = require('./addresses/addresses.json');
const providerUrl = process.env.PROVIDER_URL;
const openQAddress = addresses.OPENQ_ADDRESS;
const walletKey = process.env.WALLET_KEY;

// Configure Express server middleware
const PORT = 8090;
const app = express();
app.use(cors({ credentials: true, origin: process.env.ORIGIN_URL }));
app.use(cookieParser('entropydfnjd23'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send(`OpenQ address is: ${addresses.OPENQ_ADDRESS}`);
});

app.get('/env', (req, res) => {
    res.send(`${JSON.stringify(process.env.PROVIDER_URL)}`);
});

const withdrawIssueDepositFunctionSignature = 'function claimBounty(string, address) public';
app.post('/withdraw', async (req, res) => {
    const { issueUrl, payoutAddress } = req.body;

    const oauthToken = req.signedCookies.github_oauth_token;
    console.log(oauthToken);

    if (typeof oauthToken == "undefined") {
        res.statusCode = 401;
        return res.send("No github oauth token.");
    }

    await checkWithdrawalEligibility(issueUrl, oauthToken)
        .then(async result => {
            const { canWithdraw, reason, type, issueId } = result;

            if (canWithdraw) {
                const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
                const wallet = new ethers.Wallet(walletKey, provider);
                const contract = new ethers.Contract(openQAddress, [withdrawIssueDepositFunctionSignature], provider);
                const contractWithWallet = contract.connect(wallet);

                const issueId = await getIssueIdFromUrl(issueUrl, oauthToken);
                const issueAddress = await contractWithWallet.issueToAddress(issueId);

                const issueIsOpen = await contractWithWallet.issueIsOpen(issueId);
                if (issueIsOpen) {
                    const claimBountyResult = await contractWithWallet.claimBounty(issueId, payoutAddress);
                    res.status(200).json(result);
                } else {
                    res.status(401).json({ canWithdraw: false, type: "ISSUE_IS_CLOSED", message: "The issue you are attempting to claim has already been claimed by xyz address." });
                }
            }
        })
        .catch(error => {
            const { type, reason } = error;
            switch (type) {
                case "NOT_FOUND":
                    return res.status(404).json(error);
                case "NOT_CLOSED":
                    return res.status(404).json(error);
                case "INVALID_OAUTH_TOKEN":
                    return res.status(401).json(error);
                case "ISSUE_NOT_CLOSED_BY_USER":
                    res.statusCode = ;
                    return res.status(401).json(error);
                case "ISSUE_NOT_CLOSED_BY_PR":
                    return res.status(401).json(error);
                default:
                    return res.status(500).json(error);
            }
        });
});

const registerUserFunctionSignature = 'function registerUserAddress(string, address) public';
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