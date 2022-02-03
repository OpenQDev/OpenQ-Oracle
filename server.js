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

// Routes
app.post('/claim', async (req, res, next) => {
	try {
		const { issueUrl, payoutAddress } = req.body;
		const signedOauthToken = req.cookies.github_oauth_token;
		const claimResponse = await claim(issueUrl, payoutAddress, signedOauthToken);
		console.log('Response returned to /claim', claimResponse);
		res.status(200).json(claimResponse.data.result);
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