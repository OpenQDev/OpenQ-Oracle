const query = `query($issueId:ID!) {
    node(id: $issueId) {
      ... on Issue {
        body
        closed
        timelineItems(itemTypes: [CLOSED_EVENT], first: 10) {
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