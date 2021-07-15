import pizza from 'react-pizza'
import React from 'react'
import { css } from '@emotion/css'
import setIntervalCheck from 'interval-check'
import domify from 'domify'
import { isNotIssueReady, isNotReady, useJiraApi, useToken } from '../shared/utils'
import { Tooltip } from 'antd'

let globalDispose = null

export default function swimlaneRender() {
  if (globalDispose) {
    globalDispose()
  }

  const handle = () => {
    const headers = document.querySelectorAll('.ghx-swimlane [data-issue-key].ghx-swimlane-header')
    headers.forEach((header) => {
      if (header.querySelector('.jira-extension-estimate')) {
        return
      }
      const issueKey = header.getAttribute('data-issue-key')
      const dom = domify('<span class="jira-extension-estimate"></span>')

      pizza(() => {
        const jiraApi = useJiraApi()
        const [story, setStory] = React.useState()
        const [assignee, setAssignee] = React.useState<any>()

        React.useEffect(() => {
          jiraApi?.queryIssue(issueKey).then((res) => {
            setStory(res.data?.fields?.customfield_10002)
            setAssignee(res.data?.fields?.assignee)
          })
        }, [jiraApi])

        if (!jiraApi || !story) {
          return null
        }
        // assignee
        return (
          <>
            {!!assignee && (
              <span className="aui-avatar aui-avatar-small">
                <span className="aui-avatar-inner">
                  <Tooltip placement={'left'} title={`经办人: ${assignee.displayName}`}>
                    <img
                      alt={`经办人: ${assignee.displayName}`}
                      src={`/secure/useravatar?size=small&ownerId=${assignee.name}`}
                    />
                  </Tooltip>
                </span>
              </span>
            )}
            <span
              className={'ghx-end ghx-estimate'}
              dangerouslySetInnerHTML={{
                __html: `<aui-badge class="ghx-statistic-badge" title="Story Points">${story}</aui-badge>`
              }}
            />
          </>
        )
      })(dom, {})
      header.appendChild(dom)
      header.classList.add(css`
        display: flex;
        align-items: center;

        .ghx-heading {
          flex: 1;
          width: 0;
        }
        .jira-extension-estimate {
          padding-left: 5px;
          margin-right: 14px;
          display: flex;
          align-items: center;

          .aui-avatar {
            margin-right: 10px;
          }
        }
      `)
    })
  }

  handle()

  const dispose = setIntervalCheck(
    null,
    () => {
      handle()

      return false
    },
    500
  )

  globalDispose = dispose
}
