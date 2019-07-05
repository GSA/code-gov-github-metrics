require('dotenv').config();
const { GraphQLClient } = require('graphql-request');
var CONFIG = require('./config.json');

async function queryGitHub(repoName) {
    const endpoint = 'https://api.github.com/graphql';

    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        },
    });

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
                nodes {
                    createdAt
                    state
                    mergedAt
                    closedAt
                    authorAssociation
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
        dataJSON.repository.issues.nodes = issues;
    }

    if (dataJSON.repository.pullRequests.pageInfo.hasNextPage) {
        var pullRequests = await queryPullRequestsDeep(repoName, dataJSON.repository.pullRequests.pageInfo.endCursor, dataJSON.repository.pullRequests.nodes);
        dataJSON.repository.pullRequests.nodes = pullRequests;
    }

    return dataJSON;
}

async function queryIssuesDeep(repoName, cursor, issues) {
    const endpoint = 'https://api.github.com/graphql';
  
    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        },
    });
  
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

async function queryPullRequestsDeep(repoName, cursor, pullRequests) {
    const endpoint = 'https://api.github.com/graphql';
  
    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        },
    });
  
    const query = /* GraphQL */ `
        query GitHub($repo: String!, $cursor: String!) {
            repository(owner:"GSA", name:$repo) {
                name
                pullRequests(first:100, after:$cursor) {
                    totalCount
                    nodes {
                        createdAt
                        state
                        mergedAt
                        closedAt
                        authorAssociation
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
    dataJSON.repository.pullRequests.nodes.forEach(pullRequest => {pullRequests.push(pullRequest)});

    if (dataJSON.repository.pullRequests.pageInfo.hasNextPage) {
        return await queryIssuesDeep(repoName, dataJSON.repository.pullRequests.pageInfo.endCursor, pullRequests);
    }

    return pullRequests;
}

function processRepo(repo) {
    var issueMetaData = getIssueMetaData(repo);
    var pullRequestMetaData = getPullRequestMetaData(repo);
    var repoData = {
        repo: repo.repository.name,
        stars: getStarCount(repo),
        watches: getWatchCount(repo),
        forks: getForkCount(repo),
        issues: getIssueCount(repo),
        openIssues: issueMetaData[0],
        openedIssues: issueMetaData[1],
        closedIssues: issueMetaData[2],
        averageIssueOpenTime: issueMetaData[3],
        pullRequests: getPullRequestCount(repo),
        openPullRequests: pullRequestMetaData[0],
        openedPullRequests: pullRequestMetaData[1],
        internalPullRequestsOpened: pullRequestMetaData[2],
        externalPullRequestsOpened: pullRequestMetaData[3],
        firstTimeContributorPullRequestsOpened: pullRequestMetaData[4],
        mergedPullRequests: pullRequestMetaData[5],
        closedPullRequests: pullRequestMetaData[6],
        averagePullRequestMergeTime: pullRequestMetaData[7],
    };
    return repoData;
}

function aggregateRepoData(repos) {
    var totalData = {
        repo: "TOTAL",
        stars: repos.map(repo => repo.stars).reduce((a, b) => a + b, 0),
        watches: repos.map(repo => repo.watches).reduce((a, b) => a + b, 0),
        forks: repos.map(repo => repo.forks).reduce((a, b) => a + b, 0),
        issues: repos.map(repo => repo.issues).reduce((a, b) => a + b, 0),
        openIssues: repos.map(repo => repo.openIssues).reduce((a, b) => a + b, 0),
        openedIssues: repos.map(repo => repo.openedIssues).reduce((a, b) => a + b, 0),
        closedIssues: repos.map(repo => repo.closedIssues).reduce((a, b) => a + b, 0),
        pullRequests: repos.map(repo => repo.pullRequests).reduce((a, b) => a + b, 0),
        openPullRequests: repos.map(repo => repo.openPullRequests).reduce((a, b) => a + b, 0),
        openedPullRequests: repos.map(repo => repo.openedPullRequests).reduce((a, b) => a + b, 0),
        internalPullRequestsOpened: repos.map(repo => repo.internalPullRequestsOpened).reduce((a, b) => a + b, 0),
        externalPullRequestsOpened: repos.map(repo => repo.externalPullRequestsOpened).reduce((a, b) => a + b, 0),
        firstTimeContributorPullRequestsOpened: repos.map(repo => repo.firstTimeContributorPullRequestsOpened).reduce((a, b) => a + b, 0),
        mergedPullRequests: repos.map(repo => repo.mergedPullRequests).reduce((a, b) => a + b, 0),
        closedPullRequests: repos.map(repo => repo.closedPullRequests).reduce((a, b) => a + b, 0),
    };
    return totalData;
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

function getPullRequestMetaData(repoData) {
    var pullRequestsOpen = 0;
    var pullRequestsOpened = 0;
    var internalPullRequestsOpened = 0;
    var externalPullRequestsOpened = 0;
    var firstTimeContributorPullRequestsOpened = 0;
    var pullRequestsMerged = 0;
    var pullRequestsClosed = 0;
    var openTimes = [];
    repoData.repository.pullRequests.nodes.forEach(function(pullRequest) {
        if (pullRequest.state === "OPEN") {
            pullRequestsOpen += 1;
        }
        var timeCreated = new Date(pullRequest.createdAt);
        if (timeCreated > START_TIME && timeCreated < END_TIME) {
            pullRequestsOpened += 1;
            if (pullRequest.authorAssociation === "OWNER" || pullRequest.authorAssociation === "MEMBER" || pullRequest.authorAssociation === "COLLABORATOR") {
                internalPullRequestsOpened += 1;
            }
            if (pullRequest.authorAssociation === "FIRST_TIMER" || pullRequest.authorAssociation === "FIRST_TIME_CONTRIBUTOR" || pullRequest.authorAssociation === "CONTRIBUTOR") {
                externalPullRequestsOpened += 1;
            }
            if (pullRequest.authorAssociation === "FIRST_TIMER" || pullRequest.authorAssociation === "FIRST_TIME_CONTRIBUTOR"){
                firstTimeContributorPullRequestsOpened += 1;
            }
        }
        if (pullRequest.mergedAt && pullRequest.state === "MERGED") {
            var timeMerged = new Date(pullRequest.mergedAt);
            if (timeMerged > START_TIME && timeMerged < END_TIME) {
                pullRequestsMerged += 1;
            }
            // Time open in days
            var timeOpen = (timeMerged - timeCreated) / 1000 / 60 / 60 / 24;
            openTimes.push(timeOpen);
        }
        if (pullRequest.closedAt && pullRequest.state === "CLOSED") {
            var timeClosed = new Date(pullRequest.closedAt);
            if (timeClosed > START_TIME && timeClosed < END_TIME) {
                pullRequestsClosed += 1;
            }
        }
    });
    var averageOpenTime = openTimes.reduce((a, b) => a + b, 0) / openTimes.length;
    return [pullRequestsOpen, pullRequestsOpened, internalPullRequestsOpened, externalPullRequestsOpened, firstTimeContributorPullRequestsOpened, pullRequestsMerged, pullRequestsClosed, averageOpenTime];
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
            {id: 'pullRequests', title: 'Pull Requests'},
            {id: 'openPullRequests', title: 'Open Pull Requests'},
            {id: 'openedPullRequests', title: 'Opened Pull Requests'},
            {id: 'internalPullRequestsOpened', title: 'Internal Opened Pull Requests'},
            {id: 'externalPullRequestsOpened', title: 'External Opened Pull Requests'},
            {id: 'firstTimeContributorPullRequestsOpened', title: 'First Time Contributor Opened Pull Requests'},
            {id: 'mergedPullRequests', title: 'Merged Pull Requests'},
            {id: 'closedPullRequests', title: 'Closed Pull Requests'},
            {id: 'averagePullRequestMergeTime', title: 'Average Pull Request Time to Merge'}
        ]
    });

    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

// Get start and end times from the command line arguments
const START_TIME = new Date(process.argv[2]);
const END_TIME = new Date(process.argv[3]);

// Start the process
fetchGitHubData();