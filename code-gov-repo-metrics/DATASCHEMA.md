# Data Schema

## Metrics for all time

The first set of metrics in the .csv report is based on the entire history of the repository as of the time of the script running:

| Metric Name                                | Unit   | Description                         |
| :----------------------------------------- |:------:| :---------------------------------- |
| Stars                                      | #      | # of stars ⭐ |
| Watches                                    | #      | # of watches 👀 |
| Forks                                      | #      | # of forks 🍴 |
| Issues                                     | #      | # of issues (all time) ❗ |
| Issues (Internal)                          | #      | # of issues (all time) created by an internal contributor ❗ |
| Issues (External)                          | #      | # of issues (all time) created by an external contributor ❗ |
| Open Issues                                | #      | # of issues currently open ❗ |
| Stale Issues                               | #      | # of issues currently stale ❗ |
| % Stale Issues                             | %      | % of open issues that are stale ❗ |
| Old Issues                                 | #      | # of issues currently old ❗ |
| % Old Issues                               | %      | % of open issues that are old ❗ |
| % Issues Closed by Pull Request            | %      | % of closed issues that were closed by a pull request ❗ |
| Average Issue Open Time (Days)             | Days   | Average time from an issue being opened to being closed ⌚ |
| Pull Requests                              | #      | # of pull requests (all time) 🛵 |
| Pull Requests (Internal)                   | #      | # of pull requests (all time) created by an internal contributor 🛵 |
| Pull Requests (External)                   | #      | # of pull requests (all time) created by an external contributor 🛵 |
| Open Pull Requests                         | #      | # of pull requests currently open 🛵 |
| Average Pull Request Time to Merge (Days)  | Days   | Average time from a pull request being opened to being merged ⌚ |
| Contributors (All Time)                    | #      | Number of people who have made a contribution to the repo at any point 👩🏽‍💻 |
| Contributors (All Time - Internal)         | #      | Number of internal contributors who have made a contribution to the repo at any point 👩🏽‍💻 |
| Contributors (All Time - External)         | #      | Number of external contributors who have made a contribution to the repo at any point 👩🏽‍💻 |

## Metrics for the specific time period provided

The second set in the .csv report is based on the specific time period provided through command line arguments:

| Metric Name                                | Unit   | Description                         |
| :----------------------------------------- |:------:| :-----------------------------------|
| Issues Opened                              | #      | # of issues opened during the period ❗ |
| Issues Opened (Internal)                   | #      | # of issues opened by an internal contributor during the period ❗ |
| Issues Opened (External)                   | #      | # of issues opened by an external contributor during the period ❗ |
| Issues Opened (First Time Contributor)     | #      | # of issues opened by a first time contributor during the period ❗ |
| Issues Closed                              | #      | # of issues closed during the period ❌ |
| Pull Requests Merged                       | #      | # of pull requests merged during the period :squirrel: |
| Pull Requests Closed                       | #      | # of pull requests closed during the period ❌ |
| Contributors (This Period)                 | #      | Number of people who have made a contribution to the repo during the period 👩🏽‍💻 |
| Contributors (This Period - Internal)      | #      | Number of internal contributors who have made a contribution to the repo during the period 👩🏽‍💻 |
| Contributors (This Period - External)      | #      | Number of external contributors who have made a contribution to the repo during the period 👩🏽‍💻 |

## Aggregate metrics

Finally, the last row of the .csv report aggregates these same metrics for all of the repositories.

## Definitions

**Contributor**: a GitHub user who has either opened an issue or opened a pull request. This is, admittedly, not an ideal metric for a few reasons:

1. People can make contributions in a number of ways beyond issues/pull requests (like mockups, UX research, documentation, and more)
2. The main script uses usernames to identify unique users (because the GitHub GraphQL API unfortunately doesn't provide a unique ID for each user). Therefore, if a GitHub user make a contribution, changes their username, and then makes another contribution, they will be counted as two contributorr
3. If a contributor transitions from internal to external or vice versa (e.g. a code.gov team member who leaves the team but continues to make contributions as an external contributor), they will also be counted as 2 different contributors

**Internal contributors:** a contributor who is a member of the code.gov team (i.e. an owner, member, or collaborator on the repository being examined)

**External contributors:** a contributor who is not a member of the code.gov team (i.e. a contributor or no assocation to the repository being examined)

**First time contributor:** an external contributor who has just made their first contribution to the repository being examined

**Stale Issue:** an open issue that has not had any activity (comment, label change, assignment, etc.) for at least 14 days based on when the report was run

**Old Issue:** an open issue that has been open for more than 120 days based on when the report was run

**Closed by a pull request:** an issue that was closed [by a reference in a pull request](https://github.blog/2013-05-14-closing-issues-via-pull-requests/)

🛵: The 🛵 emoji is an unofficial symbol of a VSPR (Very Special Pull Request) which, obviously, all of our pull requests are

:squirrel: : The :squirrel: emoji is an unofficial indication that [the GitHub team uses internally](https://www.quora.com/On-GitHub-what-is-the-significance-of-the-Ship-It-squirrel) to signify that a pull request is ready to be merged and shipped

