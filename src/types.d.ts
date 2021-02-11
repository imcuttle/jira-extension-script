
declare var JIRA: {
  API?: {
    Projects: {
      getCurrentProjectKey(): string
    }
  }

  Issue: {
    getIssueKey(): string
    getIssueId(): string
  }

  Users: {
    LoggedInUser: {
      userName(): string
    }
  }
}

declare function getJiraRestURL(): string
