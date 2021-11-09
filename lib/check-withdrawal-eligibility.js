const axios = require('axios');
const GET_ISSUE_CLOSER = require('./query/GET_ISSUE_CLOSER');
const getIssueIdFromUrl = require('./issueUrlToId');

const getIssueCloser = (issueId, oauthToken) => {
	return new Promise((resolve, reject) => {
		axios.post(
			'https://api.github.com/graphql',
			{
				query: GET_ISSUE_CLOSER,
				variables: { issueId },
			},
			{
				headers: {
					'Authorization': 'token ' + oauthToken,
				},
			}
		)
			.then(response => {
				const closer = response.data.data.node.timelineItems.nodes[0].closer.author.login;
				resolve(closer);
			}).catch(error => {
				reject(error);
			});
	});
};

const getIssueClosedEvents = (issueId, oauthToken) => {
	return new Promise((resolve, reject) => {
		axios.post(
			'https://api.github.com/graphql',
			{
				query: GET_ISSUE_CLOSER,
				variables: { issueId },
			},
			{
				headers: {
					'Authorization': 'token ' + oauthToken,
				},
			}
		)
			.then(response => {
				resolve(response);
			}).catch(error => {
				reject(error);
			});
	});
};

const checkWithdrawalEligibility = async (issueUrl, oauthToken) => {
	return new Promise(async (resolve, reject) => {
		let issueId = '';

		try {
			let response = await getIssueIdFromUrl(issueUrl, oauthToken);
			issueId = response.issueId;

		} catch (error) {
			if (error.type == 'NOT_FOUND') {
				return reject({ canWithdraw: false, type: 'NOT_FOUND', message: `No issue found with url ${issueUrl}` });
			}
			if (error.response && error.response.status == 401) {
				return reject({ canWithdraw: false, type: 'INVALID_OAUTH_TOKEN', message: 'Your GitHub OAuth token is not authorized to access this resource' });
			}
			return reject({ canWithdraw: false, type: 'UNKNOWN_ERROR', message: error });
		}

		try {
			let response = await getIssueClosedEvents(issueId, oauthToken);
			const data = response.data;
			const node = data.data.node;
			const viewer = data.data.viewer.login;

			if (data.errors && data.errors[0].type == 'NOT_FOUND') {
				return reject({ issueId, canWithdraw: false, type: 'NOT_FOUND', message: `No issue found with id ${issueId}` });
			}

			if (node.closed != true) {
				return reject({ issueId, canWithdraw: false, type: 'NOT_CLOSED', message: `The issue at ${issueUrl} is still open on GitHub.` });
			}

			if (node.timelineItems.nodes[0].closer == null) {
				return reject({ issueId, canWithdraw: false, type: 'ISSUE_NOT_CLOSED_BY_PR', message: 'Issue was not closed by a PR' });
			}

			const closer = node.timelineItems.nodes[0].closer.author.login;
			const prUrl = node.timelineItems.nodes[0].closer.url;

			if (closer == viewer) {
				return resolve({ issueId, canWithdraw: true, type: 'CAN_WITHDRAW', message: `User ${viewer} closed issue ${issueId} with pull request ${prUrl}` });
			} else {
				return reject({ issueId, canWithdraw: false, type: 'ISSUE_NOT_CLOSED_BY_USER', message: `Issue with url ${issueUrl} was not closed by ${viewer}. It was closed by ${closer}.` });
			}
		} catch (error) {
			if (error.response && error.response.status == 401) {
				return reject({ issueId, canWithdraw: false, type: 'INVALID_OAUTH_TOKEN', message: 'Your GitHub OAuth token is not authorized to access this resource' });
			}
			return reject({ issueId, canWithdraw: false, type: 'UNKNOWN_ERROR', message: error.message });
		}
	});
};

module.exports = checkWithdrawalEligibility;
exports = module.exports;
exports.getIssueCloser = getIssueCloser;