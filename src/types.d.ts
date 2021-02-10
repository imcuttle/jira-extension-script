
declare var JIRA: {
  API?: {
    Projects: {
      getCurrentProjectKey(): string
    }
  }

  Users: {
    LoggedInUser: {
      userName(): string
    }
  }
}

declare function getJiraRestURL(): string
