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
    return Math.round(number * 100);
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

module.exports = { 
    millisecondsToDays: millisecondsToDays,
    toPercent: toPercent,
    sumList: sumList,
    averageList: averageList,
    concatenateLists: concatenateLists,
    unionSets: unionSets,
    unionSetSize: unionSetSize,
    formatDate: formatDate,
    isValidDateString: isValidDateString,
    isValidDate: isValidDate
};