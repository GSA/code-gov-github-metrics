const mainQuery = /* GraphQL */ `
    query GitHub($repo: String!) {
        repository(owner:"GSA", name:$repo) {
            name
            issues(first:100) {
                totalCount
                nodes {
                    createdAt
                    author {
                        login
                    }
                    authorAssociation
                    state
                    timelineItems(last:100) {
                        nodes { 
                            __typename
                            ... on AddedToProjectEvent {
                                createdAt
                            }
                            ... on AssignedEvent {
                                createdAt
                            }
                            ... on ClosedEvent {
                                createdAt
                                closer {
                                    __typename
                                    ... on PullRequest {
                                        id
                                    }
                                    ... on Commit {
                                        id
                                    }
                                }
                            }
                            ... on CommentDeletedEvent {
                                createdAt
                            }
                            ... on ConvertedNoteToIssueEvent {
                                createdAt
                            }
                            ... on CrossReferencedEvent {
                                createdAt
                            }
                            ... on DemilestonedEvent {
                                createdAt
                            }
                            ... on IssueComment {
                                createdAt
                            }
                            ... on LabeledEvent {
                                createdAt
                            }
                            ... on LockedEvent {
                                createdAt
                            }
                            ... on MentionedEvent {
                                createdAt
                            }
                            ... on MilestonedEvent {
                                createdAt
                            }
                            ... on MovedColumnsInProjectEvent {
                                createdAt
                            }
                            ... on PinnedEvent {
                                createdAt
                            }
                            ... on ReferencedEvent {
                                createdAt
                            }
                            ... on RemovedFromProjectEvent {
                                createdAt
                            }
                            ... on RenamedTitleEvent {
                                createdAt
                            }
                            ... on ReopenedEvent {
                                createdAt
                            }
                            ... on SubscribedEvent {
                                createdAt
                            }
                            ... on TransferredEvent {
                                createdAt
                            }
                            ... on UnassignedEvent {
                                createdAt
                            }
                            ... on UnlabeledEvent {
                                createdAt
                            }
                            ... on UnlockedEvent {
                                createdAt
                            }
                            ... on UnpinnedEvent {
                                createdAt
                            }
                            ... on UnsubscribedEvent {
                                createdAt
                            }
                            ... on UserBlockedEvent {
                                createdAt
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
            pullRequests(first:100) {
                totalCount
                nodes {
                    createdAt
                    state
                    mergedAt
                    closedAt
                    author {
                        login
                    }
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
                    createdAt
                    state
                    closedAt
                    author {
                        login
                    }
                    authorAssociation
                    timelineItems(last:100) {
                        nodes { 
                            __typename
                            ... on AddedToProjectEvent {
                                createdAt
                            }
                            ... on AssignedEvent {
                                createdAt
                            }
                            ... on ClosedEvent {
                                createdAt
                                closer {
                                    __typename
                                    ... on PullRequest {
                                        id
                                    }
                                    ... on Commit {
                                        id
                                    }
                                }
                            }
                            ... on CommentDeletedEvent {
                                createdAt
                            }
                            ... on ConvertedNoteToIssueEvent {
                                createdAt
                            }
                            ... on CrossReferencedEvent {
                                createdAt
                            }
                            ... on DemilestonedEvent {
                                createdAt
                            }
                            ... on IssueComment {
                                createdAt
                            }
                            ... on LabeledEvent {
                                createdAt
                            }
                            ... on LockedEvent {
                                createdAt
                            }
                            ... on MentionedEvent {
                                createdAt
                            }
                            ... on MilestonedEvent {
                                createdAt
                            }
                            ... on MovedColumnsInProjectEvent {
                                createdAt
                            }
                            ... on PinnedEvent {
                                createdAt
                            }
                            ... on ReferencedEvent {
                                createdAt
                            }
                            ... on RemovedFromProjectEvent {
                                createdAt
                            }
                            ... on RenamedTitleEvent {
                                createdAt
                            }
                            ... on ReopenedEvent {
                                createdAt
                            }
                            ... on SubscribedEvent {
                                createdAt
                            }
                            ... on TransferredEvent {
                                createdAt
                            }
                            ... on UnassignedEvent {
                                createdAt
                            }
                            ... on UnlabeledEvent {
                                createdAt
                            }
                            ... on UnlockedEvent {
                                createdAt
                            }
                            ... on UnpinnedEvent {
                                createdAt
                            }
                            ... on UnsubscribedEvent {
                                createdAt
                            }
                            ... on UserBlockedEvent {
                                createdAt
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
                    author {
                        login
                    }
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