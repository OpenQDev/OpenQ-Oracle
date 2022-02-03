require('dotenv').config();
const axios = require('axios');

const claim = async (issueUrl, payoutAddress, signedOauthToken) => {
	// Autotask returns 200 even if application speciif
	return axios.post(process.env.OZ_CLAIM_AUTOTASK_URL, { issueUrl, payoutAddress }, { headers: { 'X-Authorization': signedOauthToken } });
};

module.exports = claim;