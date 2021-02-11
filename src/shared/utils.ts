import lodashGet from 'lodash.get'
import React from 'react'

export const isNotReady = () =>
  typeof JIRA === 'undefined' ||
  !lodashGet(JIRA, 'Users.LoggedInUser.userName', () => undefined)() ||
  !lodashGet(JIRA, 'API.Projects.getCurrentProjectKey', () => undefined)()

export const isNotIssueReady = () =>
  typeof JIRA === 'undefined' ||
  !lodashGet(JIRA, 'Issue.getIssueKey', () => undefined)()


export const useToken = () => {
  const result = React.useState<string>(localStorage.getItem('jira:api-token') || '')
  React.useEffect(() => {
    localStorage.setItem('jira:api-token', result[0])
  }, [result[0]])

  React.useEffect(() => {
    const handle = (evt) => {
      if (evt.key === 'jira:api-token') {
        result[1](evt.newValue)
      }
    }
    window.addEventListener('storage', handle)
    return () => window.removeEventListener('storage', handle)
  }, [result[1]])

  return result
}
