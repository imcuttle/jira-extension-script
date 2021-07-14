declare var requirejs: any
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
declare var jQuery: any
declare var GH: {
  WorkSelectionController: {
    getSelectedIssueKeys: () => string[]
    updateUIAndState: () => void
  }

  SwimlaneView: {
    rerenderCell: () => void
    rerenderCellOfIssue: () => void
    rerenderIssue: (key: string) => void
  }

  DetailsView: {
    reload: () => void
  }
}

declare var AJS: any

declare function getJiraRestURL(): string
