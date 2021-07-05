
declare var JIRA: {
  API?: {
    Projects: {
      getCurrentProjectKey(): string
    }
  }

  Issue: {
    getIssueKey(): string
    getIssueId(): string
    refreshSubtasks(): void;
    reload(): void;
  }

  Users: {
    LoggedInUser: {
      userName(): string
    }
  }
}

declare function getJiraRestURL(): string
