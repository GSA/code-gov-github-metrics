# code-gov-github-metrics
This project compiles and calculates GitHub metrics across [the different repos that make up code.gov](https://github.com/GSA/code-gov) so that the code.gov team can understand and track community contributions and other data points over time.

## Getting Started
First clone the repo locally:

```
git clone https://github.com/GSA/code-gov-github-metrics.git
```

Then move into the repo's directory and install the NPM dependencies:

```
cd code-gov-github-metrics
npm install
```

Next, create a .env file based on the template:

```
cp .env.example .env
```

Now, [create a GitHub Personal Access Token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line#creating-a-token). You should only need to enable the "repo" scope (the first checkbox) when creating your token. Once you have your token, insert it into the newly created .env file, replacing `<INSERT YOUR PERSONAL ACCESS TOKEN HERE>`. Don't include any spaces in the .env file!

## Configuration

The main script will query the GitHub repositories specified in [`config.json`](https://github.com/GSA/code-gov-github-metrics/blob/master/config.json). In this file, `owner` refers to the GitHub organization that owns the repositories (in this case, GSA) and `repoList` is the list of repositories to include in the report. This script should be reusable for different organizations/repositories by changing [`config.json`](https://github.com/GSA/code-gov-github-metrics/blob/master/config.json) accordingly. 

## Usage

To generate a new report, run a command like the one below. The two command line arguments are the start date and end date of the specific time period you want to generate data for. Both dates should be in the format `YYYY-MM-DD`. The script will convert these dates to Date objects that correspond to midnight GMT on those days. If you fail to specify dates or specify invalid dates, the script should let you know.

```
node index.js 2019-06-01 2019-07-01
```

### .csv report

Running this script will create a .csv file report in the reports folder with the name `<CURRENT DATE> | <START OF TIME PERIOD TO QUERY> -> <END OF TIME PERIOD TO QUERY>.csv`. For instance, if you ran the script on July 9, 2019 to query data about the month of June 2019 (6/1/2019 - 7/1/2019), the report file name would be `2019-7-9 | 2019-6-1 -> 2019-7-1.csv`.

The report will contain a number of metrics both about the repositories both for all time and for the specific time period you specified. The descriptions/definitions of these metrics can be found in [DATASCHEMA](https://github.com/GSA/code-gov-github-metrics/blob/master/DATASCHEMA.md)

## Contributing

See [CONTRIBUTING](https://github.com/GSA/code-gov-github-metrics/blob/master/CONTRIBUTING.md)

## License

See [LICENSE](https://github.com/GSA/code-gov-github-metrics/blob/master/LICENSE.md)

## Questions?
If you have questions, please feel free to contact us:  
* Open an issue
* [LinkedIn](https://www.linkedin.com/company/code-gov/)  
* [Twitter](https://twitter.com/@CodeDotGov)  
* [Email](mailto:code@gsa.gov)
* Join our `#opensource-public` channel on Slack: https://chat.18f.gov/
