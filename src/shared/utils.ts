import lodashGet from 'lodash.get'
import React from 'react'
import { EventEmitter } from 'events'

export const isNotReady = () =>
  typeof JIRA === 'undefined' ||
  !lodashGet(JIRA, 'Users.LoggedInUser.userName', () => undefined)() ||
  !lodashGet(JIRA, 'API.Projects.getCurrentProjectKey', () => undefined)()

export const isNotIssueReady = () =>
  typeof JIRA === 'undefined' || !lodashGet(JIRA, 'Issue.getIssueKey', () => undefined)()

const tokenEmitter = new EventEmitter()
export const useToken = () => {
  const result = React.useState<string>(localStorage.getItem('jira:api-token') || '')
  React.useEffect(() => {
    tokenEmitter.emit('changed', result[0])
    localStorage.setItem('jira:api-token', result[0])
  }, [result[0]])

  React.useEffect(() => {
    const handler = (token) => {
      result[1](token)
    }
    tokenEmitter.addListener('changed', handler)
    return () => tokenEmitter.removeListener('changed', handler)
  }, [result[1]])

  return result
}
