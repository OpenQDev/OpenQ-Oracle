const axios = require('axios');

const getUserCanAssignAddress = async (username, oauthToken, address) => {
	return new Promise((resolve, reject) => {
		axios.get('https://api.github.com/user/repos',
			{
				headers: {
					'Authorization': 'token ' + oauthToken,
				}
			})
			.then(result => {
				// could probably change to a GraphQL filter query on the repo name, return 404 if not found, to prevent looping
				result.data.forEach(repo => {
					if (repo.name == address && repo.owner.login == username) {
						return resolve(true);
					}
				});
				return resolve(false);
			})
			.catch(error => {
				return reject(error);
			});
	});
};

module.exports = async (username, oauthToken, address) => {
	return getUserCanAssignAddress(username, oauthToken, address)
		.then(result => {
			console.log(result);
			return result;
		}).catch(e => {
			throw e;
		});
};