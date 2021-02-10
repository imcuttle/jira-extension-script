import merge from 'lodash.merge'
import JiraApi from './jira-api'
import { notification, Typography } from 'antd'
import React from 'react'
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

  _createIssueReqBody({
    estimate,
    priority,
    epicLink,
    assignee,
    reporter = JIRA.Users.LoggedInUser.userName(),
    ...data
  }: {
    estimate?: number
    reporter?: string
    assignee?: string
    epicLink?: any
    summary?: string
    description?: string
    priority?: string
    [prop: string]: any
  } = {}) {
    const config = merge(
      {
        customfield_10002: estimate,
        customfield_10005: epicLink,
        project: {
          key: JIRA.API.Projects.getCurrentProjectKey()
        },
        // https://jira.zhenguanyu.com/rest/api/2/project/$PROJECT  可以获取 issuetype 列表
        issuetype: {
          name: '故事'
        },
        assignee: {
          name: assignee
        },
        reporter: {
          name: reporter
        },
        labels: [process.env.NODE_ENV === 'production' ? 'jira-import' : 'jira-import__debug'],
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
    { toast = true } = {}
  ) {
    const res = await this.request({
      method: 'POST',
      url: '/issue/bulk',
      data: {
        issueUpdates: tasksBody.map((body) => ({
          fields: this._createIssueReqBody({ ...body, ...reqBody })
        }))
      }
    })

    if (!toast) {
      return res
    }

    const issues = res.data.issues
    if (issues && issues.length) {
      notification.success({
        message: '创建 Jira Issue 成功',
        description: (
          // key in ("YFDTR-31309", "YFDTR-31322")
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
    } else {
      notification.error({
        message: '创建 Jira Issue 失败'
      })
    }

    return res
  }

  _toastErrors(errors, config?) {
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

  queryProject(key) {
    return this.request({
      method: 'get',
      url: `/project/${key}`
    })
  }
}
