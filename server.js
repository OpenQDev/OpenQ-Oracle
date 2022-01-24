const express = require('express');
const ethers = require('ethers');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { abi: openqABI } = require('./artifacts/contracts/OpenQ/Implementations/OpenQV0.sol/OpenQV0.json');

// Helper methods
const checkWithdrawalEligibility = require('./lib/check-withdrawal-eligibility');
const { getIssueCloser } = require('./lib/check-withdrawal-eligibility');
const getUserCanAssignAddress = require('./lib/check_user_owns_address');
const getIssueIdFromUrl = require('./lib/issueUrlToId');

// Setup environment
require('dotenv').config();

// Configure Express server middleware
const PORT = 8090;
const app = express();
app.use(cors({ credentials: true, origin: process.env.ORIGIN_URL }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.post('/claim', async (req, res) => {
	const { issueUrl, payoutAddress } = req.body;

	console.log({ level: 'trace', id: payoutAddress, message: `${payoutAddress} attempting to withdraw issue at ${issueUrl}` });
	const encryptedOauthToken = req.cookies.github_oauth_token;

	axios.post(process.env.OZ_CLAIM_AUTOTASK_URL, {
		issueUrl,
		payoutAddress
	}, {
		headers: {
			'X-Authorization': encryptedOauthToken
		}
	}).then(result => {
		const { txnHash, issueId } = result.txn;
		console.log(result);
		res.status(200).json({ issueId, payoutAddress, issueUrl, txnHash });
	}).catch(error => {
		res.status(500).json(error);
	});
});

app.post('/register', async (req, res) => {
	const { username, oauthToken, address } = req.body;

	getUserCanAssignAddress(username, oauthToken, address)
		.then(canRegister => {
			if (canRegister) {
				const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
				const wallet = new ethers.Wallet(process.env.CLIENT, provider);
				const contract = new ethers.Contract(process.env.OPENQ_PROXY_ADDRESS, openqABI, provider);
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
	const { issueUrl, token } = req.body;

	getIssueIdFromUrl(issueUrl, token)
		.then(response => {
			res.send(response);
		})
		.catch(error => {
			if (error == 'NOT_FOUND') {
				res.statusCode = 404;
			}
			res.send(error);
		});
});

app.listen(PORT);

console.log(`Listening on ${PORT}`);