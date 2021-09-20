const axios = require('axios');

const getIssueClosedEvents = (issueId, oauthToken, after = null, result = { events: [], body: '' }) => {
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

  return new Promise((resolve, reject) => {
    axios
      .post(
        'https://api.github.com/graphql',
        {
          query: query,
          variables: { issueId },
        },
        {
          headers: {
            'Authorization': 'token ' + oauthToken,
          },
        }
      )
      .then(res => {
        const { node } = res.data.data;
        const hasNextPage = node.timelineItems.pageInfo.hasNextPage;
        result.events.push(...node.timelineItems.nodes);
        if (hasNextPage) {
          resolve(getIssueClosedEvents(issueId, oauthToken, res.node.timelineItems.pageInfo.endCursor, result));
        } else {
          resolve(result);
        }
      }).catch(e => {
        reject(e);
      });
  });
};

module.exports = async (username, issueId, oauthToken) => {
  return new Promise(async (resolve, reject) => {
    await getIssueClosedEvents(issueId, oauthToken)
      .then(result => {
        let releasedByPullRequest = false;
        result.events.forEach(event => {
          if (event.closer && event.closer.author.login === username) {
            releasedByPullRequest = true;
          }
        });
        resolve(releasedByPullRequest);
      }).catch(e => {
        reject(e);
      });
  });
};