// Modified from https://github.com/ethbooster/oracle/blob/main/lib/check-withdrawal-eligibility.js by mktcode

const axios = require('axios');
// recursive function to fetch all events where the issue was closed
const getIssueClosedEvents = (issueId, after = null, result = { events: [], body: '' }) => {
  const query = `query($issueId:ID!) {
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
      node(id: $issueId) {
        ... on Issue {
          body
          timelineItems(itemTypes: [CLOSED_EVENT], first: 1${after ? ', after: "' + after + '"' : ''}) {
            pageInfo {
                hasNextPage
                endCursor
            }
            nodes {
              ... on ClosedEvent {
                closer {
                  ... on PullRequest {
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

  return axios
    .post(
      'https://api.github.com/graphql',
      {
        query: query,
        variables: { issueId },
      },
      {
        headers: {
          Authorization: 'bearer ' + process.env.GH_PERSONAL_ACCESS_TOKEN,
        },
      }
    )
    .then(res => {
      const hasNextPage = res.data.data.node.timelineItems.pageInfo.hasNextPage;
      result.events.push(...res.data.data.node.timelineItems.nodes);
      if (hasNextPage) {
        return getIssueClosedEvents(issueId, res.node.timelineItems.pageInfo.endCursor, result);
      } else {
        return result;
      }
    }).catch(e => {
      throw e;
    });
};

module.exports = async (username, issueId) => {
  return getIssueClosedEvents(issueId)
    .then(result => {
      console.log(result);
      let releasedByPullRequest = false;
      result.events.forEach(event => {
        if (event.closer && event.closer.author.login === username) {
          releasedByPullRequest = true;
        }
      });
      return releasedByPullRequest;
    }).catch(e => {
      throw e;
    });
};