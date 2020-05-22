const { Octokit } = require("@octokit/rest");
const { throttling } = require("@octokit/plugin-throttling");
const Promise = require("bluebird");
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');

require('dotenv').config();

const agencies = require('./agencies-full.json');
//const agencies = require('./agencies-test.json');


const MyOctokit = Octokit.plugin(throttling);

const octokit = new MyOctokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      console.warn(`Request quota exhausted for request ${options.method} ${options.url}`)

      if (options.request.retryCount === 0) { // only retries once
        console.log(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    },
    onAbuseLimit: (retryAfter, options) => {
      // does not retry, only logs a warning
      console.warn(`Abuse detected for request ${options.method} ${options.url}`)
    }
  }
});

let missed = [];
let fullRepos = [];
let tasks = [];
let finishedJobs = [];
let inputArgs = process.argv.slice(2) || [];
let debug = false;

if (inputArgs.length) {
  switch (inputArgs[0]) {
    case 'debug':
      debug = true;

      break;
    default:
  }
}

// Build up list of Agencies & Orgs
let agenciesList = Object.keys(agencies);
let orgsList = agenciesList.reduce((a,e) => {
  a = a.concat(agencies[e]);
  return a;
}, []);


// build up jobs / tasks
for (var i = 0; i < agenciesList.length; i++) {
  let jobs = [];

  for (var j = 0; j < agencies[agenciesList[i]].length; j++) {
    jobs.push({
      job_name: agencies[agenciesList[i]][j]
    });
  }

  tasks.push({
    task_name: agenciesList[i],
    jobs: jobs
  });
}

Promise.each(tasks, task => Promise.map(task.jobs, job => getRepos(job.job_name, task.task_name), {
    'concurrency': 1
  }).each((_job) => {
    // after each job completes, push into finishedJobs array
    if (debug) console.dir({"task": task.task_name, "job": _job}, {depth: null});
    finishedJobs.push(_job);
  }))
  .then(retryFailed)
  .then(() => {
    let formatted = {};
    let output = [];

    // take the finished jobs, and count the repos
    for (var i = 0; i < finishedJobs.length; i++) {
      if (!formatted.hasOwnProperty(finishedJobs[i].agency)) {
        formatted[finishedJobs[i].agency] = [];
      }

      formatted[finishedJobs[i].agency].push(finishedJobs[i]);
    };
    
    let keys = Object.keys(formatted);

    for (var j = 0; j < keys.length; j++) {
      var temp = formatted[keys[j]].reduce((a,e) => {
        a['forks_count'] += e['forks_count'];
        a['stargazers_count'] += e['stargazers_count'];
        a['watchers_count'] += e['watchers_count'];
        a['open_issues'] += e['open_issues'];
        a['repos_count'] += e['repos_count'];

        return a;
      },{
        'agency': formatted[keys[j]][0]['agency'],
        'forks_count':0,
        'stargazers_count':0,
        'watchers_count':0,
        'repos_count':0,
        'open_issues':0
      });

      output.push(temp);
    }

    //return formatted;
    return output;
  })
  .then((formatted) => {
    // save & output
    if (debug) console.dir({"finishedJobs": finishedJobs}, {depth: null});
    if (debug) console.log('writing fullRepos to file');
    let date = new Date().toISOString().slice(0, 10);
    new ObjectsToCsv(formatted).toDisk(`./exports/${date}.csv`);

    
    fs.writeFile('repoData.json', JSON.stringify(fullRepos), (err) => {
      if (err) return console.log(err);
      if (debug) console.log('wrote to fullRepos file');
    });

    if (missed.length) {
      if (debug) console.log('writing missed to file');
      fs.writeFile('missedRepos.json', JSON.stringify(missed), (err) => {
        if (err) return console.log(err);
        console.log('wrote to missed file');
      });
    }

    printCsv(formatted);

  })
  .catch((error) => {
    if (debug) console.log(error);

    throw error;
  });

// not implemented, octokit handles this
async function retryFailed() {
  if (debug) {
    console.log("retryFailed()");
    console.dir(missed, {depth: null});
  }

  if (missed.length) {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  if (debug) console.log("No Missed Repos");
  return;
}

// function that gets the repos. agency is passed in for sorting
async function getRepos(_org, _agency) {

  // test wait 
  //await new Promise((resolve, reject) => {
  //  if (debug) console.log(`Fetching ${_org}`);
  //  //setTimeout(resolve, 10000);
  //  resolve();
  //});

  return octokit.paginate("GET /orgs/:org/repos", {
    org: _org,
    sort: "full_name",
    direction: "asc"
  })
  .then((repositories) => {
    fullRepos.push({[_org]:repositories});

    if (debug) console.dir(repositories, { depth: null});

    let reduced =  repositories.reduce((a,e) => {
      a['forks_count'] += e['forks_count'];
      a['stargazers_count'] += e['stargazers_count'];
      a['watchers_count'] += e['watchers_count'];
      a['open_issues'] += e['open_issues'];
      a['repos_count'] += 1;

      return a;
    },{
      'name': _org,
      'agency': _agency,
      'forks_count':0,
      'stargazers_count':0,
      'watchers_count':0,
      'repos_count':0,
      'open_issues':0
    });

    if (debug) console.log('fetched', reduced);

    return reduced;
  })
  .catch((error) => {
    if (debug) console.log(error);

    // store missed orgs for refetch
    missed.push({'job_name': _org, 'task_name': _agency});

    throw error;
  });
};

async function printCsv(data) {
  console.log(await new ObjectsToCsv(data).toString());
}


// https://stackoverflow.com/a/32184094
const pick = (...props) => o => props.reduce((a, e) => ({ ...a, [e]: o[e] }), {});
const remapFetchedRepos = (array) => array.reduce((a, e) => ([k] = Object.keys(e), a[k] = e[k], a) ,{});
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

