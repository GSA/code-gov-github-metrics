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

        // These metrics are for all time as of the time of the script running
        stars: getStarCount(repo),
        watches: getWatchCount(repo),
        forks: getForkCount(repo),
        issues: getIssueCount(repo),
        openIssues: issueMetaData.openIssues,
        staleIssues: issueMetaData.staleIssues,
        averageIssueOpenTime: averageList(issueMetaData.openTimes),
        pullRequests: getPullRequestCount(repo),
        openPullRequests: pullRequestMetaData.openPullRequests,
        averagePullRequestMergeTime: averageList(pullRequestMetaData.openTimes),
        contributorsAllTime: unionSets(issueMetaData.contributorsListAllTime, pullRequestMetaData.contributorsListAllTime).size,

        // These lists are included in repoData (but not the final .csv) to help with aggregation
        issueOpenTimes: issueMetaData.openTimes,
        pullRequestOpenTimes: pullRequestMetaData.openTimes,
        issueContributorsAllTime: issueMetaData.contributorsListAllTime,
        pullRequestContributorsAllTime: pullRequestMetaData.contributorsListAllTime,
        issueContributorsThisPeriod: issueMetaData.contributorsListThisPeriod,
        pullRequestContributorsThisPeriod: pullRequestMetaData.contributorsListThisPeriod,

        // These metrics are for the time period provided through command line arguments
        openedIssues: issueMetaData.openedIssues,
        openedIssuesInternal: issueMetaData.openedIssuesInternal,
        openedIssuesExternal: issueMetaData.openedIssuesExternal,
        openedIssuesFirstTimeContributor: issueMetaData.openedIssuesFirstTimeContributor,
        closedIssues: issueMetaData.closedIssues,
        openedPullRequests: pullRequestMetaData.openedPullRequests,
        openedPullRequestsInternal: pullRequestMetaData.openedPullRequestsInternal,
        openedPullRequestsExternal: pullRequestMetaData.openedPullRequestsExternal,
        openedPullRequestsFirstTimeContributor: pullRequestMetaData.openedPullRequestsFirstTimeContributor,
        mergedPullRequests: pullRequestMetaData.mergedPullRequests,
        closedPullRequests: pullRequestMetaData.closedPullRequests,
        contributorsThisPeriod: unionSets(issueMetaData.contributorsListThisPeriod, pullRequestMetaData.contributorsListThisPeriod).size
    };
    
    return repoData;
}

function aggregateRepoData(repos) {
    var totalData = {
        repo: "TOTAL",

        // These metrics are for all time as of the time of the script running
        stars: sumList(repos.map(repo => repo.stars)),
        watches: sumList(repos.map(repo => repo.watches)),
        forks: sumList(repos.map(repo => repo.forks)),
        issues: sumList(repos.map(repo => repo.issues)),
        openIssues: sumList(repos.map(repo => repo.openIssues)),
        staleIssues: sumList(repos.map(repo => repo.staleIssues)),
        averageIssueOpenTime: averageList(repos.map(repo => repo.issueOpenTimes).reduce((list1, list2) => list1.concat(list2))),
        pullRequests: sumList(repos.map(repo => repo.pullRequests)),
        openPullRequests: sumList(repos.map(repo => repo.openPullRequests)),
        averagePullRequestMergeTime: averageList(repos.map(repo => repo.pullRequestOpenTimes).reduce((list1, list2) => list1.concat(list2))),

        // These metrics are for the time period provided through command line arguments
        openedIssues: sumList(repos.map(repo => repo.openedIssues)),
        openedIssuesInternal: sumList(repos.map(repo => repo.openedIssuesInternal)),
        openedIssuesExternal: sumList(repos.map(repo => repo.openedIssuesExternal)),
        openedIssuesFirstTimeContributor: sumList(repos.map(repo => repo.openedIssuesFirstTimeContributor)),
        closedIssues: sumList(repos.map(repo => repo.closedIssues)),
        openedPullRequests: sumList(repos.map(repo => repo.openedPullRequests)),
        openedPullRequestsInternal: sumList(repos.map(repo => repo.openedPullRequestsInternal)),
        openedPullRequestsExternal: sumList(repos.map(repo => repo.openedPullRequestsExternal)),
        openedPullRequestsFirstTimeContributor: sumList(repos.map(repo => repo.openedPullRequestsFirstTimeContributor)),
        mergedPullRequests: sumList(repos.map(repo => repo.mergedPullRequests)),
        closedPullRequests: sumList(repos.map(repo => repo.closedPullRequests))
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

function sumList(list) {
    return list.reduce((a, b) => a + b, 0);
}

function averageList(list) {
    if (list.length == 0) {
        return "N/A";
    }
    return Math.round(sumList(list) / list.length);
}

// https://stackoverflow.com/questions/32000865/simplest-way-to-merge-es6-maps-sets
function unionSets(...iterables) {
    const set = new Set();
  
    for (let iterable of iterables) {
        for (let item of iterable) {
            set.add(item);
        }
    }
  
    return set;
}

function authorIsInternal(authorAssociation) {
    return authorAssociation === "OWNER" || authorAssociation === "MEMBER" || authorAssociation === "COLLABORATOR"; 
}

function authorIsExternal(authorAssociation) {
    return authorAssociation === "FIRST_TIMER" || authorAssociation === "FIRST_TIME_CONTRIBUTOR" || authorAssociation === "CONTRIBUTOR"; 
}

function authorIsFirstTimeContributor(authorAssociation) {
    return authorAssociation === "FIRST_TIMER" || authorAssociation === "FIRST_TIME_CONTRIBUTOR";
}

function getIssueMetaData(repoData) {
    var openIssues = 0;
    var staleIssues = 0;
    var openedIssues = 0;
    var openedIssuesInternal = 0;
    var openedIssuesExternal = 0;
    var openedIssuesFirstTimeContributor = 0;
    var closedIssues = 0;
    var openTimes = [];
    var contributorsListAllTime = new Set();
    var contributorsListThisPeriod = new Set();
    repoData.repository.issues.nodes.forEach(function(issue) {
        contributorsListAllTime.add(issue.author.login);

        if (issue.state === "OPEN") {
            openIssues += 1;
            // Last event is either the last event in the timeline or the creation of the issue
            var lastEvent = (issue.timelineItems.nodes[0]) ? issue.timelineItems.nodes[0].createdAt : issue.createdAt;
            lastEvent = new Date(lastEvent);
            if (millisecondsToDays(Date.now() - lastEvent) > 14) {
                staleIssues += 1;
            }
        }
        var timeCreated = new Date(issue.createdAt);
        if (timeCreated > START_DATE && timeCreated < END_DATE) {
            openedIssues += 1;
            contributorsListThisPeriod.add(issue.author.login);
            if (authorIsInternal(issue.authorAssociation)) {
                openedIssuesInternal += 1;
            }
            if (authorIsExternal(issue.authorAssociation)) {
                openedIssuesExternal += 1;
            }
            if (authorIsFirstTimeContributor(issue.authorAssociation)){
                openedIssuesFirstTimeContributor += 1;
            }
        }
        if (issue.closedAt) {
            var timeClosed = new Date(issue.closedAt);
            if (timeClosed > START_DATE && timeClosed < END_DATE) {
                closedIssues += 1;
            }
            // Time open in days
            var timeOpen = millisecondsToDays(timeClosed - timeCreated);
            openTimes.push(timeOpen);
        }
    });
    return {
        openIssues: openIssues,
        staleIssues: staleIssues,
        openedIssues: openedIssues,
        openedIssuesInternal: openedIssuesInternal,
        openedIssuesExternal: openedIssuesExternal,
        openedIssuesFirstTimeContributor: openedIssuesFirstTimeContributor,
        closedIssues: closedIssues,
        openTimes: openTimes,
        contributorsListAllTime: contributorsListAllTime,
        contributorsListThisPeriod: contributorsListThisPeriod
    };
}

function getPullRequestMetaData(repoData) {
    var openPullRequests = 0;
    var openedPullRequests = 0;
    var openedPullRequestsInternal = 0;
    var openedPullRequestsExternal = 0;
    var openedPullRequestsFirstTimeContributor = 0;
    var mergedPullRequests = 0;
    var closedPullRequests = 0;
    var openTimes = [];
    var contributorsListAllTime = new Set();
    var contributorsListThisPeriod = new Set();
    repoData.repository.pullRequests.nodes.forEach(function(pullRequest) {
        contributorsListAllTime.add(pullRequest.author.login);

        if (pullRequest.state === "OPEN") {
            openPullRequests += 1;
        }
        var timeCreated = new Date(pullRequest.createdAt);
        if (timeCreated > START_DATE && timeCreated < END_DATE) {
            openedPullRequests += 1;
            contributorsListThisPeriod.add(pullRequest.author.login);
            if (authorIsInternal(pullRequest.authorAssociation)) {
                openedPullRequestsInternal += 1;
            }
            if (authorIsExternal(pullRequest.authorAssociation)) {
                openedPullRequestsExternal += 1;
            }
            if (authorIsFirstTimeContributor(pullRequest.authorAssociation)){
                openedPullRequestsFirstTimeContributor += 1;
            }
        }
        if (pullRequest.mergedAt && pullRequest.state === "MERGED") {
            var timeMerged = new Date(pullRequest.mergedAt);
            if (timeMerged > START_DATE && timeMerged < END_DATE) {
                mergedPullRequests += 1;
            }
            // Time open in days
            var timeOpen = millisecondsToDays(timeMerged - timeCreated);
            openTimes.push(timeOpen);
        }
        if (pullRequest.closedAt && pullRequest.state === "CLOSED") {
            var timeClosed = new Date(pullRequest.closedAt);
            if (timeClosed > START_DATE && timeClosed < END_DATE) {
                closedPullRequests += 1;
            }
        }
    });
    return {
        openPullRequests: openPullRequests,
        openedPullRequests: openedPullRequests,
        openedPullRequestsInternal: openedPullRequestsInternal,
        openedPullRequestsExternal: openedPullRequestsExternal,
        openedPullRequestsFirstTimeContributor: openedPullRequestsFirstTimeContributor,
        mergedPullRequests: mergedPullRequests,
        closedPullRequests: closedPullRequests,
        openTimes: openTimes,
        contributorsListAllTime: contributorsListAllTime,
        contributorsListThisPeriod: contributorsListThisPeriod
    };
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
        var data = repos.map(repo => processRepo(repo));
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

            // These metrics are for all time as of the time of the script running
            {id: 'stars', title: 'Stars'},
            {id: 'watches', title: 'Watches'},
            {id: 'forks', title: 'Forks'},
            {id: 'issues', title: 'Issues'},
            {id: 'openIssues', title: 'Open Issues'},
            {id: 'staleIssues', title: 'Stale Issues'},
            {id: 'averageIssueOpenTime', title: 'Average Issue Open Time (Days)'},
            {id: 'pullRequests', title: 'Pull Requests'},
            {id: 'openPullRequests', title: 'Open Pull Requests'},
            {id: 'averagePullRequestMergeTime', title: 'Average Pull Request Time to Merge (Days)'},
            {id: 'contributorsAllTime', title: 'Contributors (All Time)'},

            // These metrics are for the time period provided through command line arguments
            {id: 'openedIssues', title: 'Issues Opened'},
            {id: 'openedIssuesInternal', title: 'Issues Opened (Internal)'},
            {id: 'openedIssuesExternal', title: 'Issues Opened (External)'},
            {id: 'openedIssuesFirstTimeContributor', title: 'Issues Opened (First Time Contributor)'},
            {id: 'closedIssues', title: 'Issues Closed'},
            {id: 'openedPullRequests', title: 'Pull Requests Opened'},
            {id: 'openedPullRequestsInternal', title: 'Pull Requests Opened (Internal)'},
            {id: 'openedPullRequestsExternal', title: 'Pull Requests Opened (External)'},
            {id: 'openedPullRequestsFirstTimeContributor', title: 'Pull Requests Opened (First Time Contributor)'},
            {id: 'mergedPullRequests', title: 'Pull Requests Merged'},
            {id: 'closedPullRequests', title: 'Pull Requests Closed'},
            {id: 'contributorsThisPeriod', title: 'Contributors (This Period)'}
            
        ]
    });

    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

/**
 * Logs an example of the correct format of command line arguments.
 */
function logExampleCommandLineArguments() {
    console.log("For example: node index.js 2019-12-01 2019-12-31");
}

/**
 * Validates that dateString is in the proper format.
 *
 * Ensures that dateString is in the proper format to be
 * parsed into a new Date object (YYYY-MM-DD).
 * 
 * @param {String} dateString A date as a string.
 *
 * @return {Boolean} Is dateString in the correct format (YYYY-MM-DD)?
 */
function isValidDateString(dateString) {
    return /^\d\d\d\d-\d\d-\d\d$/.test(dateString);
}

/**
 * Validates that a Date object is valid.
 *
 * Ensures that date was created correctly and is valid.
 * 
 * @param {Date} date A Date object.
 *
 * @return {Boolean} Is date a valid Date object?
 */
function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

// Create global START_DATE and END_DATE variables to be set in the validateCommandLineArguments function
var START_DATE;
var END_DATE;

/**
 * Validate that the command line arguments are correct and set START_DATE and END_DATE
 *
 * Ensures that command line arguments are correct (correct # of arguments, correct format, 
 * valid dates, start date before end date)
 *
 * @return {Boolean} Are the command line arguments valid?
 */
function validateCommandLineArguments() {
    // Validate that there are 4 command line arguments (first 2 are always path to node executable and path to script file)
    if (process.argv.length != 4) {
        console.log("Invalid inputs - please provide exactly 2 command line arguments (start date and end date).");
        logExampleCommandLineArguments();
        return false;
    }

    // Validate that the command line arguments are in the right form
    if (!isValidDateString(process.argv[2]) || !isValidDateString(process.argv[3])) {
        console.log("Invalid inputs - please provide dates in the format YYYY-MM-DD.");
        logExampleCommandLineArguments();
        return false;
    }

    // Make date objects from the command line arguments
    START_DATE = new Date(process.argv[2]);
    END_DATE = new Date(process.argv[3]);

    // Validate that start date is a valid date
    if (!isValidDate(START_DATE)) {
        console.log("Invalid inputs - please provide a valid start date in the format YYYY-MM-DD.");
        logExampleCommandLineArguments();
        return false;
    }

    // Validate that end date is a valid date
    if (!isValidDate(END_DATE)) {
        console.log("Invalid inputs - please provide a valid end date in the format YYYY-MM-DD.");
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