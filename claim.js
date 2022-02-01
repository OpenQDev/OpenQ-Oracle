require('dotenv').config();
const axios = require('axios');

const claim = async (issueUrl, payoutAddress, encryptedOauthToken) => {
	return axios.post(process.env.OZ_CLAIM_AUTOTASK_URL, { issueUrl, payoutAddress }, { headers: { 'X-Authorization': encryptedOauthToken } });
};

module.exports = claim;