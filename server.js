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
		console.log('Response returned to /claim', claimResponse);
		console.log('claimResponse.data.result', claimResponse.data.result);
		console.log(typeof 'claimResponse.data.result', typeof claimResponse.data.result);
		const claimResponseData = JSON.parse(claimResponse.data.result);
		if (claimResponseData.canWithdraw == false) {
			console.log('Cannot withdraw', claimResponse.data);
			res.status(500).json(claimResponseData);
		} else {
			console.log('Claim successful', claimResponse.data);
			res.status(200).json(claimResponseData);
		}
	} catch (error) {
		console.log('Error occured in /claim', error);
		if (error.response && error.response.data) {
			res.status(500).send(error.response.data);
		} else {
			res.status(500).send(error);
		}
	}
});

app.listen(PORT);
console.log(`OpenQ Oracle listening on ${PORT}`);