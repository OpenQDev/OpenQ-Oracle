const axios = require('axios');
const GET_ISSUE_CLOSER = require("./query/GET_ISSUE_CLOSER");

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

const checkWithdrawalEligibility = async (issueId, oauthToken) => {
  return new Promise(async (resolve, reject) => {
    await getIssueClosedEvents(issueId, oauthToken)
      .then(response => {
        const data = response.data;
        const node = data.data.node;
        const viewer = data.data.viewer.login;

        if (data.errors && data.errors[0].type == "NOT_FOUND") {
          return reject({ type: "NOT_FOUND", message: `No issue found with id ${issueId}.` });
        }

        if (node.closed != true) {
          return reject({ canWithdraw: false, type: "NOT_CLOSED", message: `The issue with id ${issueId} is not closed.` });
        }

        const closer = node.timelineItems.nodes[0].closer.author.login;

        if (closer == viewer) {
          return resolve({ canWithdraw: true, type: "SUCCESS", reason: "User closed issue with pull request, so can withdraw." });
        } else {
          return reject({ canWithdraw: false, type: "CANNOT_WITHDRAW", reason: "Issue was not closed by user" });
        }
      }).catch(error => {
        if (error.response && error.response.status == 401) {
          return reject({ canWithdraw: false, type: "INVALID_OAUTH_TOKEN", message: `Your GitHub OAuth token is not authorized to access this resource.` });
        }
        reject(error);
      });
  });
};

module.exports = checkWithdrawalEligibility;