const mainQuery = /* GraphQL */ `
query GitHub($repo: String!) {
    repository(owner:"GSA", name:$repo) {
        name
        issues(first:100) {
            totalCount
            nodes {
                title
                createdAt
                url
                labels(first:5) {
                    edges {
                        node {
                            name
                        }
                    }
                }
                author {
                    login
                }
                authorAssociation
                state
            }
            pageInfo {
                startCursor
                hasNextPage
                endCursor
            }
        }
        pullRequests(first:100) {
            totalCount
            nodes {
                createdAt
                state
                mergedAt
                closedAt
                authorAssociation
            }
            pageInfo {
                startCursor
                hasNextPage
                endCursor
            }
        }
        stargazers {
            totalCount
        }
        forks {
            totalCount
        }
        watchers {
            totalCount
        }
    }
    rateLimit {
        limit
        cost
        remaining
        resetAt
    }
}
`

const issuesQuery = /* GraphQL */ `
    query GitHub($repo: String!, $cursor: String!) {
        repository(owner:"GSA", name:$repo) {
            name
            issues(first:100, after:$cursor) {
                totalCount
                nodes {
                    title
                    url
                    labels(first:5) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                    author {
                        login
                    }
                    createdAt
                    closedAt
                    authorAssociation
                    state
                    timeline(last:1) {
                        nodes { 
                            __typename
                            ... on CrossReferencedEvent {
                                createdAt
                                id
                            }
                        }
                    }
                }
                pageInfo {
                    startCursor
                    hasNextPage
                    endCursor
                }
            }
        }  
        rateLimit {
            limit
            cost
            remaining
            resetAt
        }
    }
`

const pullRequestsQuery = /* GraphQL */ `
        query GitHub($repo: String!, $cursor: String!) {
            repository(owner:"GSA", name:$repo) {
                name
                pullRequests(first:100, after:$cursor) {
                    totalCount
                    nodes {
                        createdAt
                        state
                        mergedAt
                        closedAt
                        authorAssociation
                    }
                    pageInfo {
                        startCursor
                        hasNextPage
                        endCursor
                    }
                }
            }  
            rateLimit {
                limit
                cost
                remaining
                resetAt
            }
        }
    `

module.exports = { 
    mainQuery: mainQuery,
    issuesQuery: issuesQuery,
    pullRequestsQuery: pullRequestsQuery
};