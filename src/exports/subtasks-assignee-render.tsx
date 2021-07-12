import pizza from 'react-pizza'
import React from 'react'
import uniq from 'lodash.uniq'
import isEq from 'lodash.isequal'
import { EventEmitter } from 'events'
import { Checkbox, Form, InputNumber, notification, Popconfirm, Popover, Tooltip } from 'antd'
import { css } from '@emotion/css'
import setIntervalCheck from 'interval-check'
import domify from 'domify'
import { isNotIssueReady, isNotReady, useToken } from '../shared/utils'
import JiraApiBrowser from '../shared/jira-api-browser'
import { UserAddOutlined, LoadingOutlined } from '@ant-design/icons'
import UserSuggest from '../component/user-suggest'
import useForceUpdate from '../shared/hooks/use-forceupdate'

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

const SubtasksAssigneeComponent: React.FC<{ disabled?: boolean; subtaskKeys: any[] }> = function ({
  disabled,
  subtaskKeys
}) {
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
      disabled={loading || disabled}
      placement={'topRight'}
      overlayClassName={css`
        & .ant-popover-message-title {
          padding-left: 0;
        }
      `}
      overlayStyle={{ zIndex: 200 }}
      title={
        <UserSuggest
          disabled={disabled}
          onChange={setUser}
          value={user}
          jiraApi={jiraApi}
          style={{ width: 160 }}
          size={'small'}
          placeholder={'设置经办人'}
        />
      }
      okButtonProps={{ loading, disabled }}
      onConfirm={async () => {
        const issueKey = JIRA.Issue.getIssueKey()
        const subKeys = subtaskKeys
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
        <Tooltip title={'批量分配子任务'} placement={'bottom'}>
          <UserAddOutlined
            title={'经办人'}
            style={{ margin: '0 10px' }}
            className={
              disabled &&
              css`
                opacity: 0.5;
                cursor: not-allowed !important;
              `
            }
          />
        </Tooltip>
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
      const allSubtaskKeys = []
      let selectedSubtaskKeys = []
      const connector = new EventEmitter()
      const connector2 = new EventEmitter()

      const container =
        document.querySelector(`#view-subtasks_heading .ops`) || document.querySelector(`#subtasks_heading .ops`)

      const tbody = document.querySelector(`#subtasks table tbody`) || document.querySelector(`table#issuetable tbody`)
      if (container) {
        if (container.querySelector('.jira-extension-subtasks-assignee')) {
          return false
        }

        if (!getSubKeys().length) {
          return false
        }

        const elem = document.createElement('li')
        elem.classList.add('jira-extension-subtasks-assignee')
        container.prepend(elem)

        pizza(() => {
          const [subtaskKeys, setSubtaskKeys] = React.useState(selectedSubtaskKeys.slice())
          React.useEffect(() => {
            const handle = (keys) => {
              setSubtaskKeys(keys)
            }
            connector.addListener('next', handle)
            return () => {
              connector.removeListener('next', handle)
            }
          }, [])
          return <SubtasksAssigneeComponent disabled={!subtaskKeys.length} subtaskKeys={subtaskKeys} />
        })(elem, {})

        const td = domify(`<td></td>`)
        tbody.querySelectorAll('tr').forEach((tr) => {
          const issueKey = tr.getAttribute('data-issuekey') || tr.getAttribute('data-issue-key')
          allSubtaskKeys.push(issueKey)
          selectedSubtaskKeys.push(issueKey)
          const newTd = td.cloneNode(true)
          pizza(() => {
            const [update] = useForceUpdate()
            React.useEffect(() => {
              const handle = (checked) => {
                if (!checked) {
                  selectedSubtaskKeys = []
                } else {
                  selectedSubtaskKeys = allSubtaskKeys.slice()
                }
                connector.emit('next', selectedSubtaskKeys.slice())
                update()
              }
              connector2.addListener('next', handle)
              return () => {
                connector2.removeListener('next', handle)
              }
            }, [update])

            return (
              <Checkbox
                checked={selectedSubtaskKeys.includes(issueKey)}
                onChange={(evt) => {
                  if (evt.target.checked) {
                    const i = selectedSubtaskKeys.indexOf(issueKey)
                    i >= 0 && selectedSubtaskKeys.splice(i, 1)
                    selectedSubtaskKeys.push(issueKey)
                  } else {
                    const i = selectedSubtaskKeys.indexOf(issueKey)
                    i >= 0 && selectedSubtaskKeys.splice(i, 1)
                  }
                  connector.emit('next', selectedSubtaskKeys.slice())
                  update()
                }}
              />
            )
          })(newTd, {})
          tr.prepend(newTd)
        })

        const elem1 = document.createElement('li')
        elem1.classList.add('jira-extension-subtasks-assignee-checkout')
        container.prepend(elem1)
        pizza(() => {
          const [checked, setChecked] = React.useState(true)
          const [subtaskKeys, setSubtaskKeys] = React.useState(selectedSubtaskKeys.slice())
          React.useEffect(() => {
            const handle = (keys) => {
              setSubtaskKeys(keys)
              setChecked(!!allSubtaskKeys.length && isEq(uniq(allSubtaskKeys).sort(), uniq(keys).sort()))
            }
            connector.addListener('next', handle)
            return () => {
              connector.removeListener('next', handle)
            }
          }, [])
          return (
            <Tooltip title={'点击' + (checked ? '取消全选' : '全选')} placement={'bottom'}>
              <Checkbox
                checked={checked}
                indeterminate={!checked && !!subtaskKeys.length}
                onChange={(e) => {
                  setChecked(e.target.checked)
                  connector2.emit('next', e.target.checked)
                }}
              />
            </Tooltip>
          )
        })(elem1, {})

        connector.emit('next', selectedSubtaskKeys.slice())
      }

      return false
    },
    500
  )

  globalDispose = dispose
}
