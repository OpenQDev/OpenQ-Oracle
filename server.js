const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Setup environment
require('dotenv').config();

// Configure Express server middleware
const PORT = 8090;
const app = express();
app.use(cors({ credentials: true, origin: process.env.ORIGIN_URL }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.post('/claim', async (req, res, next) => {
	const { issueUrl, payoutAddress } = req.body;

	console.log({ level: 'trace', id: payoutAddress, message: `${payoutAddress} attempting to withdraw issue at ${issueUrl}` });

	// All this oracle does is extract the Cookie header from the client to add as a Header for the real Oracle
	const encryptedOauthToken = req.cookies.github_oauth_token;

	try {
		const result = await axios.post(process.env.OZ_CLAIM_AUTOTASK_URL, { issueUrl, payoutAddress}, { headers: { 'X-Authorization': encryptedOauthToken}});
		const { txnHash, issueId } = result.data;
		res.status(200).json({ issueId, payoutAddress, issueUrl, txnHash });
	} catch (error) {
		return next(error);
	}
});

app.use((error, req, res, next) => {
	console.log(error.response.data);
	res.status(401).json(error.response.data);
});

app.listen(PORT);
console.log(`OpenQ Oracle listening on ${PORT}`);