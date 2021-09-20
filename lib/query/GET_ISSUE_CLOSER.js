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
        timelineItems(itemTypes: [CLOSED_EVENT], first: 10) {
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

module.exports = query;