require('dotenv').config();
const { GraphQLClient } = require('graphql-request');

async function main() {
  const endpoint = 'https://api.github.com/graphql'

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    },
  })

  const query = /* GraphQL */ `
    {
        repository(owner:"GSA", name:"code-gov-front-end") {
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
            collaborators(last:10) {
                totalCount
                edges {
                    node {
                        email
                        name
                    }
                }
            }
            stargazers {
                totalCount
            }
            forks {
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

  const dataJSON = await graphQLClient.request(query);
  const dataString = JSON.stringify(dataJSON, undefined, 2);
  console.log(dataString);

  // Log the name of the most recently closed issue in the code-gov-front-end
  console.log(dataJSON["repository"]["issues"]["edges"][0]["node"]["title"]);
}

main().catch(error => console.error(error))