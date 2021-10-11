const axios = require('axios');
const GET_ISSUE_CLOSER = require("./query/GET_ISSUE_CLOSER");
const getIssueIdFromUrl = require('./issueUrlToId');

// FAILURE Scenarios
// user is unauthorized
// issue does not exist
// issue exists but is not closed
// issue exists, is closed, but not closed by user

// SUCCESS scenarios
// user is authorized, issue exists, is closed, and is closed by user

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
    let issueId = "";

    try {
      let response = await getIssueIdFromUrl(issueUrl, oauthToken);
      issueId = response;
    } catch (error) {
      if (error.type == "NOT_FOUND") {
        return reject({ canWithdraw: false, type: "NOT_FOUND", message: `No issue found with url ${issueUrl}.` });
      }
      if (error.response && error.response.status == 401) {
        return reject({ canWithdraw: false, type: "INVALID_OAUTH_TOKEN", message: `Your GitHub OAuth token is not authorized to access this resource.` });
      }
      return reject({ canWithdraw: false, type: "UNKNOWN_ERROR", message: error });
    }

    try {
      console.log("issueId", issueId);
      let response = await getIssueClosedEvents(issueId, oauthToken);
      const data = response.data;
      const node = data.data.node;
      const viewer = data.data.viewer.login;

      if (data.errors && data.errors[0].type == "NOT_FOUND") {
        return reject({ issueId, canWithdraw: false, type: "NOT_FOUND", message: `No issue found with id ${issueId}.` });
      }

      if (node.closed != true) {
        return reject({ issueId, canWithdraw: false, type: "NOT_CLOSED", message: `The issue with id ${issueId} is not closed.` });
      }

      if (node.timelineItems.nodes[0].closer == null) {
        return reject({ issueId, canWithdraw: false, type: "ISSUE_NOT_CLOSED_BY_PR", reason: `Issue was not closed by a PR` });
      }

      const closer = node.timelineItems.nodes[0].closer.author.login;
      const prUrl = node.timelineItems.nodes[0].closer.url;
      const prTitle = node.timelineItems.nodes[0].closer.title;


      if (closer == viewer) {
        return resolve({ issueId, canWithdraw: true, type: "CAN_WITHDRAW", reason: `User ${viewer} closed issue ${issueId} with pull request ${prUrl}.` });
      } else {
        return reject({ issueId, canWithdraw: false, type: "ISSUE_NOT_CLOSED_BY_USER", reason: `Issue was not closed by ${viewer}. It was closed by ${closer}` });
      }
    } catch (error) {
      if (error.response && error.response.status == 401) {
        return reject({ issueId, canWithdraw: false, type: "INVALID_OAUTH_TOKEN", message: `Your GitHub OAuth token is not authorized to access this resource.` });
      }
      reject({ issueId, canWithdraw: false, type: "UNKNOWN_ERROR", message: error.message });
    }
  });
};

module.exports = checkWithdrawalEligibility;