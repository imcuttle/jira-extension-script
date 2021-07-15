import lodashGet from 'lodash.get'
import React, { useRef } from 'react'
import { EventEmitter } from 'events'
import { parse } from 'querystring'
import JiraApiBrowser from './jira-api-browser'

export const isNotReady = () =>
  typeof JIRA === 'undefined' ||
  !lodashGet(JIRA, 'Users.LoggedInUser.userName', () => undefined)() ||
  !lodashGet(JIRA, 'API.Projects.getCurrentProjectKey', () => undefined)()

export const isNotIssueReady = () =>
  typeof JIRA === 'undefined' || !lodashGet(JIRA, 'Issue.getIssueKey', () => undefined)()

export const useToken = () => {
  return useSharedValue('jira:api-token')
}

const safeParse = (v) => {
  try {
    if (typeof v !== 'string') {
      return v
    }
    return JSON.parse(v)
  } catch (e) {
    return v
  }
}

const sharedEmitter = new EventEmitter()
export function useSharedValue<T = any>(key: string, defaultVal?: T) {
  const result = React.useState<T>(safeParse(localStorage.getItem(key) || null) ?? defaultVal)

  React.useEffect(() => {
    sharedEmitter.emit(`${key}:changed`, result[0])
    localStorage.setItem(key, JSON.stringify(result[0]))
  }, [result[0], key])

  React.useEffect(() => {
    const handler = (v) => {
      result[1](v)
    }
    sharedEmitter.addListener(`${key}:changed`, handler)
    return () => sharedEmitter.removeListener(`${key}:changed`, handler)
  }, [result[1], key])

  return result
}

export function useJiraApi() {
  const [token] = useToken()
  return React.useMemo(
    () =>
      !!token &&
      new JiraApiBrowser({
        password: token
      }),
    [token]
  )
}

export function useLocationQuery() {
  return React.useMemo(() => parse(location.search.slice(1)), [location.search])
}
