require('dotenv').config();
const { GraphQLClient } = require('graphql-request');
var CONFIG = require('./config.json');

async function queryGitHub(repoName) {
    const endpoint = 'https://api.github.com/graphql';

    const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
        authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    },
    })

    const query = /* GraphQL */ `
    query GitHub($repo: String!) {
        repository(owner:"GSA", name:$repo) {
            name
            issues(first:100) {
                totalCount
                nodes {
                    title
                    createdAt
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
                pageInfo {
                    startCursor
                    hasNextPage
                    endCursor
                }
            }
            pullRequests(first:100) {
                totalCount
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

    if (dataJSON.repository.issues.pageInfo.hasNextPage) {
        var issues = await queryIssuesDeep(repoName, dataJSON.repository.issues.pageInfo.endCursor, dataJSON.repository.issues.nodes);
        dataJSON.repository.issues.edges = issues;
    }

    return dataJSON;
}

async function queryIssuesDeep(repoName, cursor, issues) {
    const endpoint = 'https://api.github.com/graphql';
  
    const graphQLClient = new GraphQLClient(endpoint, {
      headers: {
        authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      },
    })
  
    const query = /* GraphQL */ `
        query GitHub($repo: String!, $cursor: String!) {
            repository(owner:"GSA", name:$repo) {
                name
                issues(first:100, after:$cursor) {
                    totalCount
                    nodes {
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
                        createdAt
                        closedAt
                        authorAssociation
                        state
                        timeline(last:1) {
                            nodes { 
                                __typename
                                ... on CrossReferencedEvent {
                                    createdAt
                                    id
                                }
                            }
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
    dataJSON.repository.issues.nodes.forEach(issue => {issues.push(issue)});

    if (dataJSON.repository.issues.pageInfo.hasNextPage) {
        return await queryIssuesDeep(repoName, dataJSON.repository.issues.pageInfo.endCursor, issues);
    }

    return issues;
  }

function processRepo(repoData) {
    var repoData = {
        repo: repoData.repository.name,
        stars: getStarCount(repoData),
        watches: getWatchCount(repoData),
        forks: getForkCount(repoData),
        issues: getIssueCount(repoData),
        openIssues: getIssueMetaData(repoData)[0],
        openedIssues: getIssueMetaData(repoData)[1],
        closedIssues: getIssueMetaData(repoData)[2],
        averageIssueOpenTime: getIssueMetaData(repoData)[3],
        pullRequests: getPullRequestCount(repoData)
    };
    return repoData;
}

function aggregateRepoData(repos) {
    var repoData = {
        repo: "TOTAL",
        stars: repos.map(repo => repo.stars).reduce((a, b) => a + b, 0),
        watches: repos.map(repo => repo.watches).reduce((a, b) => a + b, 0),
        forks: repos.map(repo => repo.forks).reduce((a, b) => a + b, 0),
        issues: repos.map(repo => repo.issues).reduce((a, b) => a + b, 0),
        openIssues: repos.map(repo => repo.openIssues).reduce((a, b) => a + b, 0),
        openedIssues: repos.map(repo => repo.openedIssues).reduce((a, b) => a + b, 0),
        closedIssues: repos.map(repo => repo.closedIssues).reduce((a, b) => a + b, 0),
        pullRequests: repos.map(repo => repo.pullRequests).reduce((a, b) => a + b, 0),
    };
    return repoData;
}

function getStarCount(repoData) {
    return repoData.repository.stargazers.totalCount;
}

function getWatchCount(repoData) {
    return repoData.repository.watchers.totalCount;
}

function getForkCount(repoData) {
    return repoData.repository.forks.totalCount;
}

function getIssueCount(repoData) {
    return repoData.repository.issues.totalCount;
}

function getPullRequestCount(repoData) {
    return repoData.repository.pullRequests.totalCount;
}

function getIssueMetaData(repoData) {
    var issuesOpen = 0;
    var issuesOpened = 0;
    var issuesClosed = 0;
    var openTimes = [];
    repoData.repository.issues.nodes.forEach(function(issue) {
        if (issue.state === "OPEN") {
            issuesOpen += 1;
        }
        var timeCreated = new Date(issue.createdAt);
        if (timeCreated > START_TIME && timeCreated < END_TIME) {
            issuesOpened += 1;
        }
        if (issue.closedAt) {
            var timeClosed = new Date(issue.closedAt);
            console.log(timeClosed - timeCreated);
            if (timeClosed > START_TIME && timeClosed < END_TIME) {
                issuesClosed += 1;
            }
            // Time open in days
            var timeOpen = (timeClosed - timeCreated) / 1000 / 60 / 60 / 24;
            openTimes.push(timeOpen);
        }
    });
    var averageOpenTime = openTimes.reduce((a, b) => a + b, 0) / openTimes.length;
    return [issuesOpen, issuesOpened, issuesClosed, averageOpenTime];
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
        {id: 'issues', title: 'Issues'},
        {id: 'openIssues', title: 'Open Issues'},
        {id: 'openedIssues', title: 'Opened Issues'},
        {id: 'closedIssues', title: 'Closed Issues'},
        {id: 'averageIssueOpenTime', title: 'Average Issue Open Time'},
        {id: 'pullRequests', title: 'Pull Requests'}
    ]
    });

    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

// Get start and end times from the command line arguments
const START_TIME = new Date(process.argv[2]);
const END_TIME = new Date(process.argv[3]);

// Start the process
fetchGitHubData();