// MATH UTILS

/**
 * Converts milliseconds to days.
 * 
 * @param {Number} milliseconds milliseconds to convert to days
 *
 * @return {Number} days
 */
function millisecondsToDays(milliseconds) {
    return milliseconds / 1000 / 60 / 60 / 24;
}

/**
 * Converts a decimal to a percent.
 * 
 * @param {Number} number decimal to convert to percent
 *
 * @return {Number} percent
 */
function toPercent(number) {
    return Math.round(number * 100) + "%";
}

// LIST UTILS

/**
 * Sums the contents of a list.
 * 
 * @param {Array} list list to sum
 *
 * @return {Number} sum of the list
 */
function sumList(list) {
    return list.reduce((a, b) => a + b, 0);
}

/**
 * Averages the contents of a list.
 * 
 * @param {Array} list list to average
 *
 * @return {Number} average of the list
 */
function averageList(list) {
    if (list.length == 0) {
        return "N/A";
    }
    return Math.round(sumList(list) / list.length);
}

/**
 * Concatenates a list of lists into one shallow list.
 * 
 * @param {Array} list list of lists to concatenate
 *
 * @return {Array} concatenated, shallow list
 */
function concatenateLists(lists) {
    return lists.reduce((list1, list2) => list1.concat(list2));
}

// SET UTILS

/**
 * Calculates the union of a group of Sets.
 * 
 * Based on: https://stackoverflow.com/questions/32000865/simplest-way-to-merge-es6-maps-sets
 * 
 * @param {Sets} iterables Sets (as individual arguments)
 *
 * @return {Set} union of the argument Sets
 */
function unionSets(...iterables) {
    const set = new Set();
  
    for (let iterable of iterables) {
        for (let item of iterable) {
            set.add(item);
        }
    }
  
    return set;
}

/**
 * Calculates the number of items in the union of a list of sets.
 * 
 * Based on: https://stackoverflow.com/questions/32000865/simplest-way-to-merge-es6-maps-sets
 * 
 * @param {Array} sets list of Set objects
 *
 * @return {Number} size of the union of the argument sets
 */
function unionSetSize(sets) {
    return sets.reduce((set1, set2) => unionSets(set1, set2)).size;
}

// DATE UTILS 

/**
 * Format a Date object as a string in the format YYYY-MM-DD
 * 
 * @param {Date} date Date to convert to a string
 *
 * @return {String} date as String in format YYYY-MM-DD 
 */
function formatDate(date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}

/**
 * Validates that dateString is in the proper format.
 *
 * Ensures that dateString is in the proper format to be
 * parsed into a new Date object (YYYY-MM-DD).
 * 
 * @param {String} dateString A date as a string.
 *
 * @return {Boolean} is dateString in the correct format (YYYY-MM-DD)?
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
 * @return {Boolean} is date a valid Date object?
 */
function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

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
 * In this case, a first time contributor refers to an external contributor
 * who has just made their first contribution to the repository being examined
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
    console.log("For example: node index.js 2018-12-01 2018-12-31");
}

// Export these utils functions so they can be used in index.js
module.exports = { 
    millisecondsToDays,
    toPercent,
    sumList,
    averageList,
    concatenateLists,
    unionSets,
    unionSetSize,
    formatDate,
    isValidDateString,
    isValidDate,
    getStarCount,
    getWatchCount,
    getForkCount,
    getIssueCount,
    getPullRequestCount,
    authorIsInternal,
    authorIsExternal,
    authorIsFirstTimeContributor,
    logExampleCommandLineArguments
};