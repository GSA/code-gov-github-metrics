require('dotenv').config();
const { GraphQLClient } = require('graphql-request');

async function queryGitHub(repoName) {
  const endpoint = 'https://api.github.com/graphql'

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    },
  })

  const query = /* GraphQL */ `
    query GitHub($repo: String!) {
        repository(owner:"GSA", name:$repo) {
            name
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

  const variables = {
    repo: repoName
  }

  const dataJSON = await graphQLClient.request(query, variables);
  const dataString = JSON.stringify(dataJSON, undefined, 2);
  // console.log(dataString);

  // Log the name of the most recently closed issue in the code-gov-front-end
  // console.log(dataJSON["repository"]["issues"]["edges"][0]["node"]["title"]);
  return dataJSON;
}

function processRepo(repoData) {
    var repoData = {
        repo: repoData["repository"]["name"],
        stars: getStarCount(repoData),
        watches: getWatchCount(repoData),
        forks: getForkCount(repoData)
    };
    return repoData;
}

function getStarCount(repoData) {
    return repoData["repository"]["stargazers"]["totalCount"];
}

function getWatchCount(repoData) {
    return repoData["repository"]["watchers"]["totalCount"];
}

function getForkCount(repoData) {
    return repoData["repository"]["forks"]["totalCount"];
}

async function fetchGitHubData() {
    repos = ["code-gov", "code-gov-front-end", "code-gov-api", "code-gov-api-client", "code-gov-font", "code-gov-harvester", "code-gov-developer-docs", "code-gov-style", "code-gov-adapters", "code-gov-validator", "code-gov-integrations", "json-schema-web-component", "json-schema-validator-web-component", "code-gov-about-page", "code-gov-fscp-react-component", "code-gov-data"];

    var githubPromise;
    var promises = [];

    repos.forEach(async function(repo) {
        console.log(repo);
        githubPromise = queryGitHub(repo).catch(error => console.error(error));
        promises.push(githubPromise);
    });

    Promise.all(promises).then(function(repoData) {
        var data = repoData.map(repoData => processRepo(repoData));
        console.log(data.length);
        console.log(repos.length);
        writeCSV(data);
    });
}

async function writeCSV(data) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;  
    const csvWriter = createCsvWriter({  
    path: 'out.csv',
    header: [
        {id: 'repo', title: 'Repo Name'},
        {id: 'stars', title: 'Stars'},
        {id: 'watches', title: 'Watches'},
        {id: 'forks', title: 'Forks'},
    ]
    });

    csvWriter.writeRecords(data).then(()=> console.log('The CSV file was written successfully'));
}

fetchGitHubData();