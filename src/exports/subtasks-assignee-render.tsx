import pizza from 'react-pizza'
import React from 'react'
import uniq from 'lodash.uniq'
import { Form, InputNumber, notification, Popconfirm, Popover } from 'antd'
import { css } from '@emotion/css'
import setIntervalCheck from 'interval-check'
import { isNotIssueReady, isNotReady, useToken } from '../shared/utils'
import JiraApiBrowser from '../shared/jira-api-browser'
import { UserAddOutlined, LoadingOutlined } from '@ant-design/icons'
import UserSuggest from '../component/user-suggest'

const getSubKeys = () => {
  const table = document.querySelector('#issuetable, #subtasks .ghx-container .aui')
  if (!table) {
    return []
  }
  return uniq(
    [].slice.apply(table.querySelectorAll('.ghx-key, [data-issue-key]')).map((node) => {
      return node.getAttribute('data-issue-key') || node.textContent.trim()
    })
  )
}

const SubtasksAssigneeComponent: React.FC<{}> = function () {
  const [token] = useToken()
  const jiraApi = React.useMemo(
    () =>
      new JiraApiBrowser({
        password: token
      }),
    [token]
  )
  const [loading, setLoading] = React.useState(false)
  const [user, setUser] = React.useState(undefined)
  React.useEffect(() => {
    jiraApi.queryIssue(JIRA.Issue.getIssueKey()).then((res: any) => {
      let user = null
      if (res.data.fields) {
        if (res.data.fields.assignee) {
          user = res.data.fields.assignee.key
        }
      }
      setUser(user || JIRA?.Users?.LoggedInUser?.userName())
    })
  }, [JIRA.Issue.getIssueKey()])

  if (!token || isNotReady() || isNotIssueReady()) {
    return null
  }

  return (
    <Popconfirm
      okText={'确定'}
      cancelText={'取消'}
      icon={null}
      disabled={loading}
      placement={'topRight'}
      overlayClassName={css`
        & .ant-popover-message-title {
          padding-left: 0;
        }
      `}
      overlayStyle={{ zIndex: 200 }}
      title={
        <UserSuggest
          onChange={setUser}
          value={user}
          jiraApi={jiraApi}
          style={{ width: 160 }}
          size={'small'}
          placeholder={'设置经办人'}
        />
      }
      okButtonProps={{ loading }}
      onConfirm={async () => {
        const issueKey = JIRA.Issue.getIssueKey()
        const subKeys = getSubKeys()
        if (subKeys.length) {
          setLoading(true)
          await jiraApi.setAssignees(
            subKeys.map((issueIdOrKey) => ({
              issueIdOrKey,
              assignee: { name: user || null }
            }))
          )
          setLoading(false)

          const backlogContainer = document.querySelector('#ghx-rabid')
          if (backlogContainer) {
            const itemDom: HTMLDivElement = backlogContainer.querySelector(
              `[data-issue-key=${JSON.stringify(issueKey)}]`
            )
            if (itemDom && itemDom.click) {
              itemDom.click()
            }
          } else {
            // 详情页
            JIRA.Issue?.reload?.()
          }

          notification.success({ message: '子任务更新经办人成功' })
        }
      }}
    >
      {loading ? (
        <LoadingOutlined style={{ margin: '0 10px' }} />
      ) : (
        <UserAddOutlined title={'经办人'} style={{ margin: '0 10px' }} />
      )}
    </Popconfirm>
  )
}

const handleClick = () => {
  subtasksAssigneeRender()
}

let globalDispose = null

export default function subtasksAssigneeRender() {
  const backlogContainer = document.querySelector('#ghx-rabid')
  if (backlogContainer) {
    backlogContainer.removeEventListener('click', handleClick)
    backlogContainer.addEventListener('click', handleClick)
  }

  if (globalDispose) {
    globalDispose()
  }

  const dispose = setIntervalCheck(
    null,
    () => {
      const container =
        document.querySelector(`#view-subtasks_heading .ops`) || document.querySelector(`#subtasks_heading .ops`)
      if (container) {
        if (container.querySelector('.jira-extension-subtasks-assignee')) {
          return false
        }

        if (!getSubKeys().length) {
          dispose()
          return false
        }

        const elem = document.createElement('li')
        elem.classList.add('jira-extension-subtasks-assignee')
        container.prepend(elem)

        pizza(SubtasksAssigneeComponent)(elem, {})
      }

      return false
    },
    500
  )

  globalDispose = dispose
}
