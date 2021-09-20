const axios = require('axios');

const getIssueIdFromUrl = (owner, repoName, number, oauthToken) => {
    const query = `query ($owner: String!, $repoName: String!, $number: Int!) {
        repository(owner: $owner, name: $repoName) {
          issue(number: $number) {
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
                    variables: { owner, repoName, number },
                },
                {
                    headers: {
                        'Authorization': 'token ' + oauthToken,
                    },
                }
            )
            .then(res => {
                const { data } = res;
                resolve(data);
            }).catch(e => {
                if (error.message == "Could not resolve to an Issue with the number of") {
                    reject(e);
                } else {
                    reject(e);
                }
            });
    });
};

module.exports = async (owner, repoName, number, oauthToken) => {
    return new Promise(async (resolve, reject) => {
        await getIssueIdFromUrl(owner, repoName, number, oauthToken)
            .then(result => {
                resolve(result);
            }).catch(e => {
                reject(e);
            });
    });
};