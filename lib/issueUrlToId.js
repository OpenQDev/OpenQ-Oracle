const axios = require('axios');

const parseGitHubUrl = (githubUrl) => {
	let url;
	let pathArray = [];
	let githubData = [];

	try {
		url = new URL(githubUrl);
		pathArray = url.pathname.split('/');
	} catch (error) {
		return githubData;
	}
	// orgName
	githubData.push(pathArray[1]);

	// repoName
	githubData.push(pathArray[2]);

	// issueId
	githubData.push(parseInt(pathArray[4]));

	return githubData;
};

const getIssueIdFromUrl = (issueUrl, token) => {
	let pathArray = parseGitHubUrl(issueUrl);
	const [orgName, repoName, issueNumber] = pathArray;

	const query = `query ($orgName: String!, $repoName: String!, $issueNumber: Int!) {
      viewer {
				login
			}  
			repository(owner: $orgName, name: $repoName) {
          issue(number: $issueNumber) {
            id
          }
        }
      }`;

	return new Promise((resolve, reject) => {
		axios
			.post(
				'https://api.github.com/graphql',
				{
					query: query,
					variables: { orgName, repoName, issueNumber },
				},
				{
					headers: {
						'Authorization': 'token ' + token,
					},
				}
			)
			.then(res => {
				if (res.data.errors && res.data.errors[0].type == 'NOT_FOUND') {
					reject({ type: 'NOT_FOUND', message: `No issue found with url ${issueUrl}.` });
				}
				resolve({ issueId: res.data.data.repository.issue.id, viewer: res.data.data.viewer.login });
			}).catch(error => {
				reject(error);
			});
	});
};

module.exports = async (issueUrl, token) => {
	return new Promise(async (resolve, reject) => {
		await getIssueIdFromUrl(issueUrl, token)
			.then(result => {
				resolve(result);
			}).catch(e => {
				reject(e);
			});
	});
};