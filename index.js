require('dotenv').config();
const { GraphQLClient } = require('graphql-request');
var CONFIG = require('./config.json');

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
            issues(first:2) {
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
                pageInfo {
                    startCursor
                    hasNextPage
                    endCursor
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
    };

    const dataJSON = await graphQLClient.request(query, variables);

    console.log("hasNextPage", dataJSON.repository.issues.pageInfo.hasNextPage)
    if (dataJSON.repository.issues.pageInfo.hasNextPage) {
        var issues = await queryIssuesDeep(repoName, dataJSON.repository.issues.pageInfo.endCursor, dataJSON.repository.issues.edges);
        dataJSON.repository.issues.edges = issues;
    }
    console.log(dataJSON.repository.issues.edges);

    return dataJSON;
}

async function queryIssuesDeep(repoName, cursor, issues) {
    console.log("cursor", cursor)
    const endpoint = 'https://api.github.com/graphql'
  
    const graphQLClient = new GraphQLClient(endpoint, {
      headers: {
        authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      },
    })
  
    const query = /* GraphQL */ `
        query GitHub($repo: String!, $cursor: String!) {
            repository(owner:"GSA", name:$repo) {
                name
                issues(first:2, after:$cursor) {
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
                    pageInfo {
                        startCursor
                        hasNextPage
                        endCursor
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
        repo: repoName,
        cursor: cursor
    };
  
    const dataJSON = await graphQLClient.request(query, variables);
    dataJSON.repository.issues.edges.forEach(issue => {issues.push(issue)});

    if (dataJSON.repository.issues.pageInfo.hasNextPage) {
        return await queryIssuesDeep(repoName, dataJSON.repository.issues.pageInfo.endCursor, issues);
    }

    return issues;
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

function aggregateRepoData(repos) {
    var repoData = {
        repo: "TOTAL",
        stars: repos.map(repo => repo["stars"]).reduce((a, b) => a + b, 0),
        watches: repos.map(repo => repo["watches"]).reduce((a, b) => a + b, 0),
        forks: repos.map(repo => repo["forks"]).reduce((a, b) => a + b, 0)
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
    repos = CONFIG.repoList;
    var githubPromise;
    var promises = [];

    repos.forEach(async function(repo) {
        console.log(repo);
        githubPromise = queryGitHub(repo).catch(error => console.error(error));
        promises.push(githubPromise);
    });

    Promise.all(promises).then(function(repos) {
        var data = repos.map(repoData => processRepo(repoData));
        var aggregatedData = aggregateRepoData(data);
        data.push(aggregatedData);
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

    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

fetchGitHubData();