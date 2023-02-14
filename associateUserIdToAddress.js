require('dotenv').config();
const axios = require('axios');

const associateUserIdToAddress = async (userId, userAddress, signedOauthToken, signature) => {
	// Autotask returns 200 even if a promise is rejected
	// We lower-case the x-authorization header because HTTP-Headers are case insensitive and some packages default to lower-casing
	// Important for us, since in the Autotask we use case-sensitive dictionary lookup like event.request.headers['x-authorization']
	const headers = { 'x-authorization': signedOauthToken, 'signature': signature }
	console.log('headers', headers)
	
	const config = { headers }
	
	console.log('config', config)
	
	return axios.post(
			process.env.OZ_USER_REGISTRATION_AUTOTASK_URL, 
			{ userId, userAddress }, 
			config
		);
};

module.exports = associateUserIdToAddress;
// git add . && git commit --amend --no-edit && git push -f