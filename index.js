require('dotenv').config();
const { GraphQLClient } = require('graphql-request');
var CONFIG = require('./config.json');
var queries = require('./queries.js');

async function queryGitHub(repoName) {
    const endpoint = 'https://api.github.com/graphql';

    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            authorization: 'Bearer ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        },
    });

    const query = queries.mainQuery;

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
  
    const query = queries.issuesQuery;
  
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

    const query = queries.pullRequestsQuery;
  
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
        staleIssues: issueMetaData[1],
        openedIssues: issueMetaData[2],
        closedIssues: issueMetaData[3],
        averageIssueOpenTime: issueMetaData[4],
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
        staleIssues: repos.map(repo => repo.staleIssues).reduce((a, b) => a + b, 0),
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

function millisecondsToDays(milliseconds) {
    return milliseconds / 1000 / 60 / 60 / 24;
}

function getIssueMetaData(repoData) {
    var issuesOpen = 0;
    var issuesOpened = 0;
    var issuesClosed = 0;
    var issuesStale = 0;
    var openTimes = [];
    repoData.repository.issues.nodes.forEach(function(issue) {
        if (issue.state === "OPEN") {
            issuesOpen += 1;
            // Last event is either the last event in the timeline or the creation of the issue
            var lastEvent = (issue.timelineItems.nodes[0]) ? issue.timelineItems.nodes[0].createdAt : issue.createdAt;
            lastEvent = new Date(lastEvent);
            if (millisecondsToDays(Date.now() - lastEvent) > 14) {
                issuesStale += 1;
            }
        }
        var timeCreated = new Date(issue.createdAt);
        if (timeCreated > START_DATE && timeCreated < END_DATE) {
            issuesOpened += 1;
        }
        if (issue.closedAt) {
            var timeClosed = new Date(issue.closedAt);
            if (timeClosed > START_DATE && timeClosed < END_DATE) {
                issuesClosed += 1;
            }
            // Time open in days
            var timeOpen = millisecondsToDays(timeClosed - timeCreated);
            openTimes.push(timeOpen);
        }
    });
    var averageOpenTime = openTimes.reduce((a, b) => a + b, 0) / openTimes.length;
    averageOpenTime = Math.round(averageOpenTime);
    return [issuesOpen, issuesStale, issuesOpened, issuesClosed, averageOpenTime];
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
        if (timeCreated > START_DATE && timeCreated < END_DATE) {
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
            if (timeMerged > START_DATE && timeMerged < END_DATE) {
                pullRequestsMerged += 1;
            }
            // Time open in days
            var timeOpen = millisecondsToDays(timeMerged - timeCreated);
            openTimes.push(timeOpen);
        }
        if (pullRequest.closedAt && pullRequest.state === "CLOSED") {
            var timeClosed = new Date(pullRequest.closedAt);
            if (timeClosed > START_DATE && timeClosed < END_DATE) {
                pullRequestsClosed += 1;
            }
        }
    });
    var averageOpenTime = openTimes.reduce((a, b) => a + b, 0) / openTimes.length;
    averageOpenTime = Math.round(averageOpenTime);
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
        path: 'repoData.csv',
        header: [
            {id: 'repo', title: 'Repo Name'},
            {id: 'stars', title: 'Stars'},
            {id: 'watches', title: 'Watches'},
            {id: 'forks', title: 'Forks'},
            {id: 'issues', title: 'Issues'},
            {id: 'openIssues', title: 'Open Issues'},
            {id: 'staleIssues', title: 'Stale Issues'},
            {id: 'openedIssues', title: 'Issues Opened'},
            {id: 'closedIssues', title: 'Issues Closed'},
            {id: 'averageIssueOpenTime', title: 'Average Issue Open Time (Days)'},
            {id: 'pullRequests', title: 'Pull Requests'},
            {id: 'openPullRequests', title: 'Open Pull Requests'},
            {id: 'openedPullRequests', title: 'Pull Requests Opened'},
            {id: 'internalPullRequestsOpened', title: 'Internal Pull Requests Opened'},
            {id: 'externalPullRequestsOpened', title: 'External Pull Requests Opened'},
            {id: 'firstTimeContributorPullRequestsOpened', title: 'First Time Contributor Pull Requests Opened'},
            {id: 'mergedPullRequests', title: 'Pull Requests Merged'},
            {id: 'closedPullRequests', title: 'Pull Requests Closed'},
            {id: 'averagePullRequestMergeTime', title: 'Average Pull Request Time to Merge (Days)'}
        ]
    });

    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

var START_DATE;
var END_DATE;

function logExampleCommandLineArguments() {
    console.log("For example: node index.js 2019-12-01 2019-12-31");
}

function validateCommandLineArguments() {
    // Validate that there are 4 command line arguments (first 2 are always path to node executable and path to script file)
    if (process.argv.length != 4) {
        console.log("Invalid inputs - please provide exactly 2 command line arguments (start date and end date).");
        logExampleCommandLineArguments();
        return false;
    }

    // Validate that the command line arguments are in the right form
    var regex = RegExp('\d\d\d\d-\d\d-\d\d');
    if (!/^\d\d\d\d-\d\d-\d\d$/.test(process.argv[2]) || !/^\d\d\d\d-\d\d-\d\d$/.test(process.argv[3])) {
        console.log("Invalid inputs - please provide dates in the format YYYY-MM-DD.");
        logExampleCommandLineArguments();
        return false;
    }

    // Make date objects from the command line arguments
    START_DATE = new Date(process.argv[2]);
    END_DATE = new Date(process.argv[3]);

    // Validate that start date is before end date
    if (START_DATE > END_DATE) {
        console.log("Invalid inputs - start date must be before end date.");
        logExampleCommandLineArguments();
        return false;
    }

    // Validate that there is at least 1 day between the start and end date
    if (millisecondsToDays(END_DATE - START_DATE) < 1) {
        console.log("Invalid inputs - end date must be at least one day after start date.");
        logExampleCommandLineArguments();
        return false;
    }

    // Command line arguments have been validated
    return true;
}

// Validate command line arguments before starting the main process
if (validateCommandLineArguments()) {
    // Start the main process
    fetchGitHubData();
}