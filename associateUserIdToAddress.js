require('dotenv').config();
const axios = require('axios');

const associateUserIdToAddress = async (userId, userAddress, signedOauthToken) => {
	// Autotask returns 200 even if a promise is rejected
	// We lower-case the x-authorization header because HTTP-Headers are case insensitive and some packages default to lower-casing
	// Important for us, since in the Autotask we use case-sensitive dictionary lookup like event.request.headers['x-authorization']
	return axios.post(process.env.OZ_USER_REGISTRATION_AUTOTASK_URL, { userId, userAddress }, { headers: { 'x-authorization': signedOauthToken } });
};

module.exports = associateUserIdToAddress;