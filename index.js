// ******************************** SET UP ********************************

// Use dotenv package to get GitHub Personal Access Token from .env
require('dotenv').config();

// Use graphql-request package to make requests to the GitHub GraphQL API
const { GraphQLClient } = require('graphql-request');

// Grab config.json where the list of repositories to query is stored
const CONFIG = require('./config.json');

// Grab queries.js where the GitHub GraphQL queries are stored
var queries = require('./queries.js');

var utils = require('./utils.js');

// GITHUB UTILS 

/**
 * Calculates the total star count for a repository.
 * 
 * @param {JSON} repo repository data from Github API
 *
 * @return {Number} total star count for repo
 */
function getStarCount(repo) {
    return repo.repository.stargazers.totalCount;
}

/**
 * Calculates the total watch count for a repository.
 * 
 * @param {JSON} repo repository data from Github API
 *
 * @return {Number} total watch count for repo
 */
function getWatchCount(repo) {
    return repo.repository.watchers.totalCount;
}

/**
 * Calculates the total fork count for a repository.
 * 
 * @param {JSON} repo repository data from Github API
 *
 * @return {Number} total fork count for repo
 */
function getForkCount(repo) {
    return repo.repository.forks.totalCount;
}

/**
 * Calculates the total issue count for a repository.
 * 
 * @param {JSON} repo repository data from Github API
 *
 * @return {Number} total issue count for repo
 */
function getIssueCount(repo) {
    return repo.repository.issues.totalCount;
}

/**
 * Calculates the total pull request count for a repository.
 * 
 * @param {JSON} repo repository data from Github API
 *
 * @return {Number} total pull request count for repo
 */
function getPullRequestCount(repo) {
    return repo.repository.pullRequests.totalCount;
}

/**
 * Determines if an authorAssociation indicates the author is internal
 * 
 * In this case, an internal author refers to a member of the 
 * code.gov team (i.e. an owner, member, or collaborator on
 * the repository being examined)
 * 
 * @param {String} authorAssociation authorAssociation from a 
 * repository's data from GitHub API
 *
 * @return {boolean} is the author internal?
 */
function authorIsInternal(authorAssociation) {
    return authorAssociation === "OWNER" || authorAssociation === "MEMBER" || authorAssociation === "COLLABORATOR"; 
}

/**
 * Determines if an authorAssociation indicates the author is external
 * 
 * In this case, an external author refers to someone who is not
 * a member of the code.gov team (i.e. a contributor or no association
 * to the repository being examined)
 * 
 * @param {String} authorAssociation authorAssociation from a 
 * repository's data from GitHub API
 *
 * @return {boolean} is the author external?
 */
function authorIsExternal(authorAssociation) {
    return authorAssociation === "FIRST_TIMER" || authorAssociation === "FIRST_TIME_CONTRIBUTOR" || authorAssociation === "CONTRIBUTOR" || authorAssociation === "NONE"; 
}

/**
 * Determines if an authorAssociation indicates the author is a 
 * first time contributor
 * 
 * In this case, a first time contributor refers to someone who is not
 * a member of the code.gov team who has just made their first contribution
 * to the repository being examined
 * 
 * @param {String} authorAssociation authorAssociation from a 
 * repository's data from GitHub API
 *
 * @return {boolean} is the author a first time contributor?
 */
function authorIsFirstTimeContributor(authorAssociation) {
    return authorAssociation === "FIRST_TIMER" || authorAssociation === "FIRST_TIME_CONTRIBUTOR";
}

// GENERAL UTILS 

/**
 * Logs an example of the correct format of command line arguments.
 */
function logExampleCommandLineArguments() {
    console.log("For example: node index.js 2019-12-01 2019-12-31");
}

// ******************************** MAIN PROCESS ********************************

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
    var contributorsListAllTime = utils.unionSets(issueMetaData.contributorsListAllTime, pullRequestMetaData.contributorsListAllTime);
    var contributorsListAllTimeInteral = utils.unionSets(issueMetaData.contributorsListAllTimeInternal, pullRequestMetaData.contributorsListAllTimeInternal);
    var contributorsListAllTimeExternal = utils.unionSets(issueMetaData.contributorsListAllTimeExternal, pullRequestMetaData.contributorsListAllTimeExternal);
    var contributorsListThisPeriod = utils.unionSets(issueMetaData.contributorsListThisPeriod, pullRequestMetaData.contributorsListThisPeriod);
    var contributorsListThisPeriodInternal = utils.unionSets(issueMetaData.contributorsListThisPeriodInternal, pullRequestMetaData.contributorsListThisPeriodInternal);
    var contributorsListThisPeriodExternal = utils.unionSets(issueMetaData.contributorsListThisPeriodExternal, pullRequestMetaData.contributorsListThisPeriodExternal);
    var contributorsListThisPeriodFirstTimeContributor = utils.unionSets(issueMetaData.contributorsListThisPeriodFirstTimeContributor, pullRequestMetaData.contributorsListThisPeriodFirstTimeContributor);
    var repoData = {
        repo: repo.repository.name,

        // These metrics are for all time as of the time of the script running
        stars: getStarCount(repo),
        watches: getWatchCount(repo),
        forks: getForkCount(repo),
        issues: getIssueCount(repo),
        internalIssues: issueMetaData.internalIssues,
        externalIssues: issueMetaData.externalIssues,
        openIssues: issueMetaData.openIssues,
        staleIssues: issueMetaData.staleIssues,
        percentStaleIssues: issueMetaData.openIssues === 0 ? "N/A" : utils.toPercent(issueMetaData.staleIssues / issueMetaData.openIssues),
        oldIssues: issueMetaData.oldIssues,
        percentOldIssues: issueMetaData.openIssues === 0 ? "N/A" : utils.toPercent(issueMetaData.oldIssues / issueMetaData.openIssues),
        percentIssuesClosedByPullRequest: issueMetaData.closedIssuesTotal === 0 ? "N/A" : utils.toPercent(issueMetaData.closedByPullRequestIssues / issueMetaData.closedIssuesTotal),
        averageIssueOpenTime: utils.averageList(issueMetaData.openTimes),
        pullRequests: getPullRequestCount(repo),
        internalPullRequests: pullRequestMetaData.internalPullRequests,
        externalPullRequests: pullRequestMetaData.externalPullRequests,
        openPullRequests: pullRequestMetaData.openPullRequests,
        averagePullRequestMergeTime: utils.averageList(pullRequestMetaData.openTimes),
        contributorsAllTime: contributorsListAllTime.size,
        contributorsAllTimeInternal: contributorsListAllTimeInteral.size,
        contributorsAllTimeExternal: contributorsListAllTimeExternal.size,

        // These lists are included in repoData (but not the final .csv) to help with aggregation
        issueOpenTimes: issueMetaData.openTimes,
        closedByPullRequestIssues: issueMetaData.closedByPullRequestIssues,
        closedIssuesTotal: issueMetaData.closedIssuesTotal,
        pullRequestOpenTimes: pullRequestMetaData.openTimes,
        contributorsListAllTime: contributorsListAllTime,
        contributorsListAllTimeInternal: contributorsListAllTimeInteral,
        contributorsListAllTimeExternal: contributorsListAllTimeExternal,
        contributorsListThisPeriod: contributorsListThisPeriod,
        contributorsListThisPeriodInternal: contributorsListThisPeriodInternal,
        contributorsListThisPeriodExternal: contributorsListThisPeriodExternal,
        contributorsListThisPeriodFirstTimeContributor: contributorsListThisPeriodFirstTimeContributor,

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
        contributorsThisPeriod: contributorsListThisPeriod.size,
        contributorsThisPeriodInternal: contributorsListThisPeriodInternal.size,
        contributorsThisPeriodExternal: contributorsListThisPeriodExternal.size,
        contributorsThisPeriodFirstTimeContributor: contributorsListThisPeriodFirstTimeContributor.size
    };
    
    return repoData;
}

function aggregateRepoData(repos) {
    var openIssues = utils.sumList(repos.map(repo => repo.openIssues));
    var staleIssues = utils.sumList(repos.map(repo => repo.staleIssues));
    var oldIssues = utils.sumList(repos.map(repo => repo.oldIssues));
    var totalData = {
        repo: "TOTAL",

        // These metrics are for all time as of the time of the script running
        stars: utils.sumList(repos.map(repo => repo.stars)),
        watches: utils.sumList(repos.map(repo => repo.watches)),
        forks: utils.sumList(repos.map(repo => repo.forks)),
        issues: utils.sumList(repos.map(repo => repo.issues)),
        internalIssues: utils.sumList(repos.map(repo => repo.internalIssues)),
        externalIssues: utils.sumList(repos.map(repo => repo.externalIssues)),
        openIssues: openIssues,
        staleIssues: staleIssues,
        percentStaleIssues: utils.toPercent(staleIssues / openIssues),
        oldIssues: oldIssues,
        percentOldIssues: utils.toPercent(oldIssues / openIssues), 
        percentIssuesClosedByPullRequest: utils.toPercent(utils.sumList(repos.map(repo => repo.closedByPullRequestIssues))/ utils.sumList(repos.map(repo => repo.closedIssuesTotal))),
        averageIssueOpenTime: utils.averageList(utils.concatenateLists(repos.map(repo => repo.issueOpenTimes))),
        pullRequests: utils.sumList(repos.map(repo => repo.pullRequests)),
        internalPullRequests: utils.sumList(repos.map(repo => repo.internalPullRequests)),
        externalPullRequests: utils.sumList(repos.map(repo => repo.externalPullRequests)),
        openPullRequests: utils.sumList(repos.map(repo => repo.openPullRequests)),
        averagePullRequestMergeTime: utils.averageList(utils.concatenateLists(repos.map(repo => repo.pullRequestOpenTimes))),
        contributorsAllTime: utils.unionSetSize(repos.map(repo => repo.contributorsListAllTime)),
        contributorsAllTimeInternal: utils.unionSetSize(repos.map(repo => repo.contributorsListAllTimeInternal)),
        contributorsAllTimeExternal: utils.unionSetSize(repos.map(repo => repo.contributorsListAllTimeExternal)),

        // These metrics are for the time period provided through command line arguments
        openedIssues: utils.sumList(repos.map(repo => repo.openedIssues)),
        openedIssuesInternal: utils.sumList(repos.map(repo => repo.openedIssuesInternal)),
        openedIssuesExternal: utils.sumList(repos.map(repo => repo.openedIssuesExternal)),
        openedIssuesFirstTimeContributor: utils.sumList(repos.map(repo => repo.openedIssuesFirstTimeContributor)),
        closedIssues: utils.sumList(repos.map(repo => repo.closedIssues)),
        openedPullRequests: utils.sumList(repos.map(repo => repo.openedPullRequests)),
        openedPullRequestsInternal: utils.sumList(repos.map(repo => repo.openedPullRequestsInternal)),
        openedPullRequestsExternal: utils.sumList(repos.map(repo => repo.openedPullRequestsExternal)),
        openedPullRequestsFirstTimeContributor: utils.sumList(repos.map(repo => repo.openedPullRequestsFirstTimeContributor)),
        mergedPullRequests: utils.sumList(repos.map(repo => repo.mergedPullRequests)),
        closedPullRequests: utils.sumList(repos.map(repo => repo.closedPullRequests)),
        contributorsThisPeriod: utils.unionSetSize(repos.map(repo => repo.contributorsListThisPeriod)),
        contributorsThisPeriodInternal: utils.unionSetSize(repos.map(repo => repo.contributorsListThisPeriodInternal)),
        contributorsThisPeriodExternal: utils.unionSetSize(repos.map(repo => repo.contributorsListThisPeriodExternal)),
        contributorsThisPeriodFirstTimeContributor: utils.unionSetSize(repos.map(repo => repo.contributorsListThisPeriodFirstTimeContributor))
    };
    return totalData;
}

function getIssueMetaData(repoData) {
    var internalIssues = 0;
    var externalIssues = 0;
    var openIssues = 0;
    var staleIssues = 0;
    var oldIssues = 0;
    var closedByPullRequestIssues = 0;
    var closedIssuesTotal = 0;
    var openedIssues = 0;
    var openedIssuesInternal = 0;
    var openedIssuesExternal = 0;
    var openedIssuesFirstTimeContributor = 0;
    var closedIssues = 0;
    var openTimes = [];
    var contributorsListAllTime = new Set();
    var contributorsListAllTimeInternal = new Set();
    var contributorsListAllTimeExternal = new Set();
    var contributorsListThisPeriod = new Set();
    var contributorsListThisPeriodInternal = new Set();
    var contributorsListThisPeriodExternal = new Set();
    var contributorsListThisPeriodFirstTimeContributor = new Set();
    repoData.repository.issues.nodes.forEach(function(issue) {
        contributorsListAllTime.add(issue.author.login);
        var timeCreated = new Date(issue.createdAt);
        
        if (authorIsInternal(issue.authorAssociation)) {
            contributorsListAllTimeInternal.add(issue.author.login);
            internalIssues += 1;
        }
        if (authorIsExternal(issue.authorAssociation)) {
            contributorsListAllTimeExternal.add(issue.author.login);
            externalIssues += 1;
        }

        if (issue.state === "OPEN") {
            openIssues += 1;
            var timelineEvents = issue.timelineItems.nodes;
            var lastTimelineEvent = timelineEvents[timelineEvents.length - 1];
            // Last event is either the last event in the timeline or the creation of the issue
            var lastEventDate = (lastTimelineEvent) ? lastTimelineEvent.createdAt : issue.createdAt;
            lastEventDate = new Date(lastEventDate);
            if (utils.millisecondsToDays(Date.now() - lastEventDate) > 14) {
                staleIssues += 1;
            }
            if (utils.millisecondsToDays(Date.now() - timeCreated) > 120) {
                oldIssues += 1;
            }
        }
        if (timeCreated > START_DATE && timeCreated < END_DATE) {
            openedIssues += 1;
            contributorsListThisPeriod.add(issue.author.login);
            if (authorIsInternal(issue.authorAssociation)) {
                openedIssuesInternal += 1;
                contributorsListThisPeriodInternal.add(issue.author.login);
            }
            if (authorIsExternal(issue.authorAssociation)) {
                openedIssuesExternal += 1;
                contributorsListThisPeriodExternal.add(issue.author.login);
            }
            if (authorIsFirstTimeContributor(issue.authorAssociation)){
                openedIssuesFirstTimeContributor += 1;
                contributorsListThisPeriodFirstTimeContributor.add(issue.author.login);
            }
        }
        if (issue.closedAt) {
            closedIssuesTotal += 1;

            var timeClosed = new Date(issue.closedAt);
            if (timeClosed > START_DATE && timeClosed < END_DATE) {
                closedIssues += 1;
            }
            // Time open in days
            var timeOpen = utils.millisecondsToDays(timeClosed - timeCreated);
            openTimes.push(timeOpen);
            /** 
             * Use this in case there are multiple closed events - uses the last one to determine
             * if the issue was closed by PR
             * */ 
            var closedByPullRequest = false;
            issue.timelineItems.nodes.forEach(function(timelineItem) {
                if (timelineItem.__typename === "ClosedEvent") {
                    if (timelineItem.closer && timelineItem.closer.__typename === "PullRequest") {
                        closedByPullRequest = true;
                    }
                }
            });
            if (closedByPullRequest) {
                closedByPullRequestIssues += 1;
            }
        }
    });
    return {
        internalIssues: internalIssues,
        externalIssues: externalIssues,
        openIssues: openIssues,
        staleIssues: staleIssues,
        oldIssues: oldIssues,
        closedByPullRequestIssues: closedByPullRequestIssues,
        closedIssuesTotal: closedIssuesTotal,
        openedIssues: openedIssues,
        openedIssuesInternal: openedIssuesInternal,
        openedIssuesExternal: openedIssuesExternal,
        openedIssuesFirstTimeContributor: openedIssuesFirstTimeContributor,
        closedIssues: closedIssues,
        openTimes: openTimes,
        contributorsListAllTime: contributorsListAllTime,
        contributorsListAllTimeInternal: contributorsListAllTimeInternal,
        contributorsListAllTimeExternal: contributorsListAllTimeExternal,
        contributorsListThisPeriod: contributorsListThisPeriod,
        contributorsListThisPeriodInternal: contributorsListThisPeriodInternal,
        contributorsListThisPeriodExternal: contributorsListThisPeriodExternal,
        contributorsListThisPeriodFirstTimeContributor: contributorsListThisPeriodFirstTimeContributor
    };
}

function getPullRequestMetaData(repoData) {
    var internalPullRequests = 0;
    var externalPullRequests = 0;
    var openPullRequests = 0;
    var openedPullRequests = 0;
    var openedPullRequestsInternal = 0;
    var openedPullRequestsExternal = 0;
    var openedPullRequestsFirstTimeContributor = 0;
    var mergedPullRequests = 0;
    var closedPullRequests = 0;
    var openTimes = [];
    var contributorsListAllTime = new Set();
    var contributorsListAllTimeInternal = new Set();
    var contributorsListAllTimeExternal = new Set();
    var contributorsListThisPeriod = new Set();
    var contributorsListThisPeriodInternal = new Set();
    var contributorsListThisPeriodExternal = new Set();
    var contributorsListThisPeriodFirstTimeContributor = new Set();
    repoData.repository.pullRequests.nodes.forEach(function(pullRequest) {
        contributorsListAllTime.add(pullRequest.author.login);

        if (authorIsInternal(pullRequest.authorAssociation)) {
            contributorsListAllTimeInternal.add(pullRequest.author.login);
            internalPullRequests += 1;
        }
        if (authorIsExternal(pullRequest.authorAssociation)) {
            contributorsListAllTimeExternal.add(pullRequest.author.login);
            externalPullRequests += 1;
        }

        if (pullRequest.state === "OPEN") {
            openPullRequests += 1;
        }
        var timeCreated = new Date(pullRequest.createdAt);
        if (timeCreated > START_DATE && timeCreated < END_DATE) {
            openedPullRequests += 1;
            contributorsListThisPeriod.add(pullRequest.author.login);
            if (authorIsInternal(pullRequest.authorAssociation)) {
                openedPullRequestsInternal += 1;
                contributorsListThisPeriodInternal.add(pullRequest.author.login);
            }
            if (authorIsExternal(pullRequest.authorAssociation)) {
                openedPullRequestsExternal += 1;
                contributorsListThisPeriodExternal.add(pullRequest.author.login);
            }
            if (authorIsFirstTimeContributor(pullRequest.authorAssociation)){
                openedPullRequestsFirstTimeContributor += 1;
                contributorsListThisPeriodFirstTimeContributor.add(pullRequest.author.login);
            }
        }
        if (pullRequest.mergedAt && pullRequest.state === "MERGED") {
            var timeMerged = new Date(pullRequest.mergedAt);
            if (timeMerged > START_DATE && timeMerged < END_DATE) {
                mergedPullRequests += 1;
            }
            // Time open in days
            var timeOpen = utils.millisecondsToDays(timeMerged - timeCreated);
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
        internalPullRequests: internalPullRequests,
        externalPullRequests: externalPullRequests,
        openPullRequests: openPullRequests,
        openedPullRequests: openedPullRequests,
        openedPullRequestsInternal: openedPullRequestsInternal,
        openedPullRequestsExternal: openedPullRequestsExternal,
        openedPullRequestsFirstTimeContributor: openedPullRequestsFirstTimeContributor,
        mergedPullRequests: mergedPullRequests,
        closedPullRequests: closedPullRequests,
        openTimes: openTimes,
        contributorsListAllTime: contributorsListAllTime,
        contributorsListAllTimeInternal: contributorsListAllTimeInternal,
        contributorsListAllTimeExternal: contributorsListAllTimeExternal,
        contributorsListThisPeriod: contributorsListThisPeriod,
        contributorsListThisPeriodInternal: contributorsListThisPeriodInternal,
        contributorsListThisPeriodExternal: contributorsListThisPeriodExternal,
        contributorsListThisPeriodFirstTimeContributor: contributorsListThisPeriodFirstTimeContributor
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
    const now = new Date();
    const dateString = utils.formatDate(now);
    const periodString = utils.formatDate(START_DATE) + " -> " + utils.formatDate(END_DATE);
    const csvWriter = createCsvWriter({
        path: 'reports/' + dateString + " | " + periodString + '.csv',
        header: [
            {id: 'repo', title: 'Repo Name'},

            // These metrics are for all time as of the time of the script running
            {id: 'stars', title: 'Stars'},
            {id: 'watches', title: 'Watches'},
            {id: 'forks', title: 'Forks'},
            {id: 'issues', title: 'Issues'},
            {id: 'internalIssues', title: 'Issues (Internal)'},
            {id: 'externalIssues', title: 'Issues (External)'},
            {id: 'openIssues', title: 'Open Issues'},
            {id: 'staleIssues', title: 'Stale Issues (No activity for >14 days)'},
            {id: 'percentStaleIssues', title: '% Stale Issues'},
            {id: 'oldIssues', title: 'Old Issues (Open for >120 days)'},
            {id: 'percentOldIssues', title: '% Old Issues'},
            {id: 'percentIssuesClosedByPullRequest', title: '% Issues Closed by Pull Request'},
            {id: 'averageIssueOpenTime', title: 'Average Issue Open Time (Days)'},
            {id: 'pullRequests', title: 'Pull Requests'},
            {id: 'internalPullRequests', title: 'Pull Requests (Internal)'},
            {id: 'externalPullRequests', title: 'Pull Requests (External)'},
            {id: 'openPullRequests', title: 'Open Pull Requests'},
            {id: 'averagePullRequestMergeTime', title: 'Average Pull Request Time to Merge (Days)'},
            {id: 'contributorsAllTime', title: 'Contributors (All Time)'},
            {id: 'contributorsAllTimeInternal', title: 'Contributors (All Time - Internal)'},
            {id: 'contributorsAllTimeExternal', title: 'Contributors (All Time - External)'},

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
            {id: 'contributorsThisPeriod', title: 'Contributors (This Period)'},
            {id: 'contributorsThisPeriodInternal', title: 'Contributors (This Period - Internal)'},
            {id: 'contributorsThisPeriodExternal', title: 'Contributors (This Period - External)'},
            {id: 'contributorsThisPeriodFirstTimeContributor', title: 'Contributors (This Period - First Time Contributor)'}
        ]
    });

    csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
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
    if (!utils.isValidDateString(process.argv[2]) || !utils.isValidDateString(process.argv[3])) {
        console.log("Invalid inputs - please provide dates in the format YYYY-MM-DD.");
        logExampleCommandLineArguments();
        return false;
    }

    /**
     * Make date objects from the command line arguments
     * The added time (" 00:00:00") is to fix a small bug in the way the Date is parsed for the .csv file name
     */ 
    START_DATE = new Date(process.argv[2] + " 00:00:00");
    END_DATE = new Date(process.argv[3] + " 00:00:00");

    // Validate that start date is a valid date
    if (!utils.isValidDate(START_DATE)) {
        console.log("Invalid inputs - please provide a valid start date in the format YYYY-MM-DD.");
        logExampleCommandLineArguments();
        return false;
    }

    // Validate that end date is a valid date
    if (!utils.isValidDate(END_DATE)) {
        console.log("Invalid inputs - please provide a valid end date in the format YYYY-MM-DD.");
        logExampleCommandLineArguments();
        return false;
    }

    // Validate that there is at least 1 day between the start and end date
    if (utils.millisecondsToDays(END_DATE - START_DATE) < 1) {
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