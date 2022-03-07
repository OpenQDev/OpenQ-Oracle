require('dotenv').config();
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Core Function
const claim = require('./claim');
const { response } = require('express');

// Configure Express server middleware
const PORT = 8090;
const app = express();
app.use(cors({ credentials: true, origin: process.env.ORIGIN_URL }));
app.use(express.json());
app.use(cookieParser());

// git add . && git commit --amend --no-edit && git push -f 
// git tag -f development && git push -f origin development

// Routes
app.post('/claim', async (req, res, next) => {
	try {
		const { issueUrl, payoutAddress } = req.body;
		const signedOauthToken = req.cookies.github_oauth_token;
		const claimResponse = await claim(issueUrl, payoutAddress, signedOauthToken);
		const claimResponseData = JSON.parse(claimResponse.data.result);
		if (claimResponseData.canWithdraw == false) {
			res.status(500).json(claimResponseData);
		} else {
			res.status(200).json(claimResponseData);
		}
	} catch (error) {
		if (error.response && error.response.data) {
			res.status(500).send(error.response.data);
		} else {
			res.status(500).send(error);
		}
	}
});

app.listen(PORT);
console.log(`OpenQ Oracle listening on ${PORT}`);