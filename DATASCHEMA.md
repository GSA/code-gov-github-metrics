# Data Schema

Running the main script of this repo (instructions in [README.md](https://github.com/GSA/code-gov-github-metrics/blob/master/README.md)) will create a .csv file report in the reports folder with the name `<CURRENT DATE> | <START OF TIME PERIOD TO QUERY> -> <END OF TIME PERIOD TO QUERY>.csv`. For instance, if you ran the script on July 9, 2019 to query data about the month of June 2019 (6/1/2019 - 7/1/2019), the report file name would be `2019-7-9 | 2019-6-1 -> 2019-7-1.csv`.

In the .csv report, there will be a row for each repository listed in the repoList in `config.json` with a number of metrics that will have been calculated for each of these repositories. 

The first set of metrics is based on the entire history of the repository as of the time of the script running:

| Metric Name                                | Unit/Type     | Description                         |
| ------------------------------------------ |:-------------:| :----------------------------------:|
| Repo Name                                  | String        | Name of the repository              |

The second set is based on the specific time period provided through command line arguments:

| Metric Name                                | Unit/Type     | Description                         |
| ------------------------------------------ |:-------------:| :----------------------------------:|
| Repo Name                                  | String        | Name of the repository              |

Finally, the last row of the .csv report aggregates these same metrics for all of the repositories.