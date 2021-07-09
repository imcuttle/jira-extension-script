import pizza from 'react-pizza'
import React from 'react'
import { css } from '@emotion/css'
import setIntervalCheck from 'interval-check'
import domify from 'domify'
import { isNotIssueReady, isNotReady, useJiraApi, useToken } from '../shared/utils'

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

        React.useEffect(() => {
          jiraApi?.queryIssue(issueKey).then((res) => {
            setStory(res.data?.fields?.customfield_10002)
          })
        }, [jiraApi])

        if (!jiraApi || !story) {
          return null
        }
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: `<span class="ghx-end ghx-estimate"><aui-badge class="ghx-statistic-badge" title="Story Points">${story}</aui-badge></span>`
            }}
          />
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
