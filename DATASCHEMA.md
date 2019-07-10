# Data Schema

## .csv report

Running the main script of this repo (instructions in [README.md](https://github.com/GSA/code-gov-github-metrics/blob/master/README.md)) will create a .csv file report in the reports folder with the name `<CURRENT DATE> | <START OF TIME PERIOD TO QUERY> -> <END OF TIME PERIOD TO QUERY>.csv`. For instance, if you ran the script on July 9, 2019 to query data about the month of June 2019 (6/1/2019 - 7/1/2019), the report file name would be `2019-7-9 | 2019-6-1 -> 2019-7-1.csv`.

In the .csv report, there will be a row for each repository listed in the repoList in `config.json` with a number of metrics that will have been calculated for each of these repositories.

### Metrics

The first set of metrics is based on the entire history of the repository as of the time of the script running:

| Metric Name                                | Unit/Type     | Description                         |
| ------------------------------------------ |:-------------:| :---------------------------------- |
| Stars                                      | #      | # of stars ⭐ |
| Watches                                    | #      | # of watches 👀 |
| Forks                                      | #      | # of forks 🍴 |
| Issues                                     | #      | # of issues (all time) ❗ |
| Issues (Internal)                          | #      | # of issues (all time) created by an internal author ❗ |
| Issues (External)                          | #      | # of issues (all time) created by an external author ❗ |
| Open Issues                                | #      | # of issues currently open ❗ |
| Stale Issues                               | #      | # of issues currently stale ❗ |
| % Stale Issues                             | %      | % of open issues that are stale ❗ |
| Old Issues                                 | #      | # of issues currently old ❗ |
| % Old Issues                               | %      | % of open issues that are old ❗ |
| % Issues Closed by Pull Request            | %      | % of closed issues that were closed by Pull Request ❗ |
| Average Issue Open Time (Days)             | Days   | Average time from an issue being opened to being closed ❗ |
| Pull Requests                              | #      | # of pull requests (all time) 🛵 |
| Pull Requests (Internal)                   | #      | # of pull requests (all time) created by an internal author 🛵 |
| Pull Requests (External)                   | #      | # of pull requests (all time) created by an external author 🛵 |
| Open Pull Requests                         | #      | # of pull requests currently open 🛵 |
| Average Pull Request Time to Merge (Days)  | Days   | Average time from a pull request being opened to being merged :squirrel: |
| Contributors (All Time)                    | #      | Number of people who have made a contribution to the repo 👩🏽‍💻 |
| Contributors (All Time - Internal)         | #      | Number of internal authors who have made a contribution to the repo 👩🏽‍💻 |
| Contributors (All Time - External)         | #      | Number of external authors who have made a contribution to the repo 👩🏽‍💻 |



The second set is based on the specific time period provided through command line arguments:

| Metric Name                                | Unit/Type     | Description                         |
| ------------------------------------------ |:-------------:| :----------------------------------:|
| Repo Name                                  | String        | Name of the repository              |

Finally, the last row of the .csv report aggregates these same metrics for all of the repositories.

### Other Definitions

**Internal author:**

**External author:**

**First time contributor:**

**Stale Issue:**

**Old Issue:**

**Closed by Pull Request:**

🛵: The 🛵 emoji is an unofficial symbol of a VSPR (Very Special Pull Request) which, obviously, all of our pull requests are

:squirrel: : The :squirrel: emoji is an unofficial indication that [the GitHub team uses internally](https://www.quora.com/On-GitHub-what-is-the-significance-of-the-Ship-It-squirrel) to signify that a pull request is ready to be merged and shipped

