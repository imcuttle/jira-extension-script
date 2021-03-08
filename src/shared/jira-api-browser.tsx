import merge from 'lodash.merge'
import JiraApi from './jira-api'
import { notification, Typography } from 'antd'
import React from 'react'
import cookie from 'js-cookie'
import url from 'url'

/**
 * /rest/greenhopper/1.0/sprint/picker?query=
 * 获取 Sprint suggest
 *
 * /rest/greenhopper/1.0/epics?searchQuery=&projectKey=YFDTR&maxResults=100&hideDone=true
 * 获取 epic link suggest
 */

export default class JiraApiBrowser extends JiraApi {
  constructor(opts: Partial<ConstructorParameters<typeof JiraApi>[0]>) {
    if (!opts.baseURL) {
      opts.baseURL = getJiraRestURL()
    }

    if (!opts.user) {
      opts.user = JIRA.Users.LoggedInUser.userName()
    }
    // @ts-ignore
    super(opts)

    this.axios.interceptors.response.use((res) => {
      if (res.data) {
        // res.data.
      }
      return res
    })
  }

  async setAssignees(dataList) {
    return Promise.all(
      dataList.map(({ issueIdOrKey, assignee }) => {
        return this.setAssignee(issueIdOrKey, assignee)
      })
    )
  }

  async setAssignee(issueIdOrKey, assignee) {
    return this.request({
      method: 'put',
      url: `/issue/${issueIdOrKey}/assignee`,
      data: assignee
    })
  }

  async querySuggestEpics({
    maxResults = 20,
    hideDone = true,
    searchQuery,
    projectKey = JIRA.API.Projects.getCurrentProjectKey()
  }: {
    maxResults?: number
    hideDone?: boolean
    searchQuery?: string
    projectKey?: string
  }) {
    return this.request({
      method: 'get',
      baseURL: url.format({ host: url.parse(this.axios.defaults.baseURL || '').host, pathname: '' }),
      url: '/rest/greenhopper/latest/epics',
      params: {
        searchQuery,
        projectKey,
        maxResults: maxResults,
        hideDone
      }
    })
  }

  async updateIssue(
    issue: string,
    {
      estimate
    }: {
      estimate?: number
    }
  ) {
    const token = cookie.get('atlassian.xsrf.token')

    const data = new FormData()
    if (estimate != null) {
      data.append('customfield_10002', estimate as any)
    }
    if (token) {
      data.append('atl_token', token)
      data.append('rapidViewId', '939')
    }
    data.append('issueId', issue)
    // @ts-ignore
    data.append('singleFieldEdit', true)
    // @ts-ignore
    data.append('skipScreenCheck', true)
    data.append('fieldsToForcePresent', 'customfield_10002')

    const res = await this.request({
      method: 'post',
      baseURL: '',
      url: '/secure/DetailsViewAjaxIssueAction.jspa?decorator=none',
      data
    })

    // this._toastErrors(res.data.errors, { message: 'Failed' }) || this._toastErrors(res.data.errorMessages, { message: 'Failed' })

    if (res.data.issue) {
      notification.success({
        message: '更新成功'
      })
    } else {
      notification.error({
        message: '更新失败'
      })
    }
  }

  async queryIssue(issue: string) {
    const res = await this.request({
      method: 'get',
      url: '/issue/' + issue
    })

    this._toastErrors(res.data.errors) || this._toastErrors(res.data.errorMessages)

    return res
  }

  async querySuggestSprints({ query }: { query?: string }) {
    return this.request({
      method: 'get',
      baseURL: url.format({ host: url.parse(this.axios.defaults.baseURL || '').host, pathname: '' }),
      url: '/rest/greenhopper/latest/sprint/picker',
      params: {
        query
      }
    })
  }

  async querySuggestUsers({ showAvatar = true, query }: { showAvatar?: boolean; query?: string }) {
    return this.request({
      method: 'get',
      url: '/user/picker',
      params: {
        query,
        showAvatar
      }
    })
  }

  async querySuggestLabels(query) {
    return this.request({
      method: 'get',
      baseURL: url.format({ host: url.parse(this.axios.defaults.baseURL || '').host, pathname: '' }),
      url: '/rest/api/1.0/labels/suggest',
      params: {
        query
      }
    })
  }

  private _createIssueReqBody({
    estimate,
    priority,
    epicLink,
    issuetype,
    sprint,
    assignee,
    labels,
    dod,
    reporter = JIRA.Users.LoggedInUser.userName(),
    ...data
  }: {
    estimate?: number
    reporter?: string
    assignee?: string
    sprint?: any
    dod?: any
    epicLink?: any
    summary?: string
    description?: string
    priority?: string
    [prop: string]: any
  } = {}) {
    const config = merge(
      {
        customfield_10002: estimate,
        customfield_10004: sprint,
        customfield_10506: dod && {
          id: dod
        },
        customfield_10005: epicLink,
        project: {
          key: JIRA.API.Projects.getCurrentProjectKey()
        },
        // https://jira.zhenguanyu.com/rest/api/2/project/$PROJECT  可以获取 issuetype 列表
        issuetype: {
          id: issuetype
        },
        assignee: {
          name: assignee
        },
        reporter: {
          name: reporter
        },
        labels: [process.env.NODE_ENV === 'production' ? 'jira-import' : 'jira-import__debug']
          .concat(labels)
          .filter(Boolean),
        priority: {
          // Low Medium High
          name: priority || 'Low'
          // id: '20000'
        }
      },
      data
    )

    if (!assignee) {
      delete config.assignee
    }
    if (!reporter) {
      delete config.reporter
    }

    return config
  }

  async createIssue(reqBody: Parameters<JiraApiBrowser['_createIssueReqBody']>[0], { toast = true } = {}) {
    const res = await this.request({
      method: 'POST',
      url: '/issue',
      data: {
        fields: this._createIssueReqBody(reqBody)
      }
    })

    if (!toast) {
      return res
    }

    const key = res.data.key
    if (key) {
      notification.success({
        message: '创建 Jira Issue 成功',
        description: (
          <div>
            <Typography.Link
              style={{ paddingRight: 4, paddingLeft: 4 }}
              key={key}
              href={`/browse/${key}`}
              target={'_blank'}
            >
              {key}
            </Typography.Link>
          </div>
        )
      })
    } else if (res.data.errors && Object.keys(res.data.errors).length) {
      this._toastErrors(res.data.errors)
    } else if (res.data.errorMessages && res.data.errorMessages.length) {
      this._toastErrors(res.data.errorMessages)
    }

    return res
  }

  async createIssues(
    {
      tasksBody,
      ...reqBody
    }: Parameters<JiraApiBrowser['_createIssueReqBody']>[0] & {
      tasksBody?: Array<Parameters<JiraApiBrowser['_createIssueReqBody']>[0]>
    } = {},
    { toastSuccess = true } = {}
  ) {
    const res = await this.request({
      method: 'POST',
      url: '/issue/bulk',
      data: {
        issueUpdates: tasksBody.map((body) => ({
          fields: this._createIssueReqBody({ ...reqBody, ...body })
        }))
      }
    })

    const issues = res.data.issues
    if (toastSuccess && issues && issues.length) {
      notification.success({
        message: '创建 Jira Issue 成功',
        description: (
          <Typography.Link
            href={url.format({
              pathname: '/issues/',
              query: { jql: `key in (${issues.map((x) => x.key).join(',')})` }
            })}
            target={'_blank'}
          >
            {issues.map((x) => x.key).join(',')}
          </Typography.Link>
        )
      })
      return
    }

    if (res.data.errors && res.data.errors[0] && res.data.errors[0].elementErrors) {
      const elementErrors = res.data.errors[0].elementErrors
      this._toastErrors(elementErrors?.errorMessages?.length ? elementErrors.errorMessages : elementErrors.errors)
    }

    return res
  }

  private _toastErrors(errors, config?) {
    if (!errors) {
      return false
    }
    if (typeof errors === 'object' && !Array.isArray(errors)) {
      errors = Object.keys(errors).map((name) => `${name}: ${errors[name]}`)
    }

    if (!errors.length) {
      return false
    }

    notification.error({
      message: '创建 Jira Issue 失败',
      description: (
        <div>
          {errors.map((message) => (
            <Typography.Paragraph key={message}>{message}</Typography.Paragraph>
          ))}
        </div>
      ),
      ...config
    })
  }

  queryProject(key = JIRA.API.Projects.getCurrentProjectKey()) {
    return this.request({
      method: 'get',
      url: `/project/${key}`
    })
  }
}
