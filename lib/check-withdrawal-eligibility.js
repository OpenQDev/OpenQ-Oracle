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

const checkWithdrawalEligibility = async (username, issueId, oauthToken) => {
  const isClosed = false;
  return new Promise(async (resolve, reject) => {
    await getIssueClosedEvents(issueId, oauthToken)
      .then(response => {
        const { data } = response.data;
        if (data.errors && data.errors[0].type == "NOT_FOUND") {
          return reject({ type: "NOT_FOUND", message: `No issue found with id ${issueId}.` });
        }

        const { node } = data;
        result.events.push(...node.timelineItems.nodes);

        getIssueClosedEvents(issueId, oauthToken, node.timelineItems.pageInfo.endCursor, result);

        let releasedByPullRequest = false;

        if (result == "Issue does not exist") {
          return reject({ canWithdraw: false, reason: "Issue does not exist" });
        }

        result.events.forEach(event => {
          if (event.closer) {
            isClosed = true;
          }
          if (event.closer && event.closer.author.login === username) {
            releasedByPullRequest = true;
          }
        });

        if (!isClosed) {
          return reject({ canWithdraw: false, reason: "Issue is not closed!" });
        }
        if (isClosed && releasedByPullRequest) {
          return resolve({ canWithdraw: true, reason: "User closed issue with pull request, so can withdraw." });
        }
      }).catch(error => {
        if (error.response && error.response.status == 401) {
          return reject({ type: "UNAUTHORIZED", message: `Your GitHub OAuth token is not authorized to access this resource.` });
        }
        reject(error);
      });
  });
};

module.exports = checkWithdrawalEligibility;