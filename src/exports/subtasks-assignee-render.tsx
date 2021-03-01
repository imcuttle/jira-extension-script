import pizza from 'react-pizza'
import React from 'react'
import uniq from 'lodash.uniq'
import { Form, InputNumber, notification, Popconfirm, Popover } from 'antd'
import { css } from '@emotion/css'
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
  const [form] = Form.useForm()
  const [token] = useToken()
  const jiraApi = React.useMemo(
    () =>
      new JiraApiBrowser({
        password: token
      }),
    [token]
  )
  React.useEffect(() => {
    jiraApi.queryIssue(JIRA.Issue.getIssueKey()).then((res: any) => {
      if (res.data.fields) {
        form.setFieldsValue({
          estimate: res.data.fields.customfield_10002
        })
      }
    })
  }, [JIRA.Issue.getIssueKey()])

  if (!token || isNotReady() || isNotIssueReady()) {
    return null
  }

  const update = () => {
    jiraApi.updateIssue(JIRA.Issue.getIssueId(), form.getFieldsValue())
  }
  const [loading, setLoading] = React.useState(false)
  const [user, setUser] = React.useState(null)

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
          notification.success({ message: '更新成功' })
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
  setTimeout(() => {
    subtasksAssigneeRender()
  }, 3500)
}

export default function subtasksAssigneeRender() {
  const backlogContainer = document.querySelector('#ghx-backlog')
  if (backlogContainer) {
    backlogContainer.removeEventListener('click', handleClick)
    backlogContainer.addEventListener('click', handleClick)
  }

  const alreadyHad = document.querySelector('.jira-extension-subtasks-assignee')
  if (alreadyHad) {
    return
  }

  const container =
    document.querySelector(`#view-subtasks_heading .ops`) || document.querySelector(`#subtasks_heading .ops`)
  if (!container) {
    setTimeout(() => {
      subtasksAssigneeRender()
    }, 1000)
    return
  }

  if (!getSubKeys().length) {
    return
  }

  const elem = document.createElement('li')
  elem.classList.add('jira-extension-subtasks-assignee')
  container.prepend(elem)

  return pizza(SubtasksAssigneeComponent)(elem, {})
}
