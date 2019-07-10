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
