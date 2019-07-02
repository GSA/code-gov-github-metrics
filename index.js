require('dotenv').config();
const { GraphQLClient } = require('graphql-request');

async function queryGitHub() {
  const endpoint = 'https://api.github.com/graphql'

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    },
  })

  const query = /* GraphQL */ `
    query GitHub($repo: String!) {
        repository(owner:"GSA", name:$repo) {
            issues(last:10) {
                totalCount
                edges {
                    node {
                        title
                        url
                        labels(first:5) {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                        author {
                            login
                        }
                        authorAssociation
                        state
                    }
                }
            }
            collaborators(last:100) {
                totalCount
                edges {
                    node {
                        email
                        name
                        organizations(first:100) {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                        organization(login:GSA) {
                            name
                        }
                    }
                }
            }
            stargazers {
                totalCount
            }
            forks {
                totalCount
            }
            watchers {
                totalCount
            }
            pullRequests(last:10) {
                totalCount
                edges {
                    node {
                        title
                        createdAt
                        mergedAt
                        closedAt
                        author {
                            login
                        }
                        authorAssociation
                    }
                }
            }
        }
        rateLimit {
            limit
            cost
            remaining
            resetAt
        }
    }
  `

  var repo = "code-gov-front-end";

  const variables = {
    repo: repo,
  }

  const dataJSON = await graphQLClient.request(query, variables);
  const dataString = JSON.stringify(dataJSON, undefined, 2);
  console.log(dataString);

  // Log the name of the most recently closed issue in the code-gov-front-end
  console.log(dataJSON["repository"]["issues"]["edges"][0]["node"]["title"]);
}

queryGitHub().catch(error => console.error(error))