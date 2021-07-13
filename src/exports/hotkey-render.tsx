import pizza from 'react-pizza'
import { HotKeyChainManager } from 'hotkey-chain'
import lazy from 'lazy-value'
import uniqBy from 'lodash.uniqby'
import React from 'react'
import open from '@rcp/util.open'

import { useJiraApi, useSharedValue, useToken } from '../shared/utils'
import { Alert, Form, Modal, notification, Spin, Switch, Tooltip, Typography } from 'antd'
import uniq from 'lodash.uniq'
import { getIssueKeys } from '../shared/jira-helper'
import UserSuggest from '../component/user-suggest'
import JiraApiBrowser from '../shared/jira-api-browser'

const getDom = lazy(() => {
  const div = document.createElement('div')
  div.classList.add('jira-extension-hotkey')
  document.body.appendChild(div)

  return div
})

const initialValue = {
  assigneeSubTask: true,
  assigneeParentTask: true
}

function AssignModal({ cb, keys, jiraApi }: any) {
  const [form] = Form.useForm()
  const [data, setData] = React.useState([])
  const [isLoading, setLoading] = React.useState(false)
  const [setting, setSetting] = useSharedValue('jira-extension-hotkey-render', initialValue)

  React.useEffect(() => {
    setLoading(true)
    jiraApi
      .search(`key in (${keys.join(',')})`)
      .then((res) => {
        if (res.data?.issues) {
          setData(res.data?.issues)
          const assigneeList = res.data?.issues.map((issue) => {
            if (issue.fields?.assignee) {
              return issue.fields?.assignee.name
            }
          })
          const prevAssignees = uniq(assigneeList)
          if (prevAssignees.length === 1 && prevAssignees[0]) {
            form.setFieldsValue({
              assignee: prevAssignees[0]
            })
          } else {
            form.setFieldsValue({
              assignee: JIRA.Users.LoggedInUser.userName()
            })
          }
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [jiraApi, keys])

  React.useEffect(() => {
    form.setFieldsValue({
      ...form.getFieldsValue(),
      ...setting
    })
  }, [])

  const { parents, subtasks } = React.useMemo(() => {
    const parents = []
    const subtasks = []
    data.forEach((issue) => {
      if (issue.fields.parent?.key) {
        parents.push(issue.fields.parent)
      }
      if (issue.fields?.subtasks?.length) {
        subtasks.push(...issue.fields?.subtasks)
      }
    })
    return { parents: uniqBy(parents, 'key'), subtasks: uniqBy(subtasks, 'key') }
  }, [data, setting.assigneeSubTask])

  const renderFields = (fields) => {
    return fields.map((field) => (
      <Tooltip key={field.key} title={field.fields?.summary}>
        <Typography.Link
          strong
          href={`/browse/${field.key}`}
          target={'_blank'}
          style={{ paddingLeft: 3, paddingRight: 3 }}
        >
          {field.key}
        </Typography.Link>
      </Tooltip>
    ))
  }

  return (
    <Modal
      okText={'分配'}
      confirmLoading={isLoading}
      width={600}
      visible
      title={'分配任务'}
      onOk={async () => {
        const values = await form.validateFields()
        if (values) {
          try {
            setLoading(true)
            await (jiraApi as JiraApiBrowser).setAssignees(
              data
                .concat(values.assigneeParentTask ? parents : [], values.assigneeSubTask ? subtasks : [])
                .map((issue) => ({
                  issueIdOrKey: issue.key,
                  assignee: { name: values.assignee }
                }))
            )
            notification.success({
              message: '分配任务成功'
            })
            cb(true)
            const btn = document.querySelector('.aui-nav-selected .aui-nav-item') as HTMLElement
            if (btn) {
              btn.click()
            }
          } catch (e) {
            notification.error({
              message: '分配任务失败'
            })
          } finally {
            setLoading(false)
          }
        }
      }}
      onCancel={() => cb(false)}
    >
      <Spin spinning={isLoading}>
        <Typography.Paragraph>
          <Alert
            message={
              <>
                <Typography.Paragraph>分配：{renderFields(data)} Issue</Typography.Paragraph>
                {!!parents.length && setting.assigneeParentTask && (
                  <Typography.Paragraph>父 Issues：{renderFields(parents)}</Typography.Paragraph>
                )}
                {!!subtasks.length && setting.assigneeSubTask && (
                  <Typography.Paragraph>子 Issues：{renderFields(subtasks)}</Typography.Paragraph>
                )}
                {
                  <Typography.Paragraph>
                    总共分配：
                    {((setting.assigneeSubTask && subtasks.length) || 0) +
                      ((setting.assigneeParentTask && parents.length) || 0) +
                      data.length}{' '}
                    个 Issue
                  </Typography.Paragraph>
                }
              </>
            }
            type="info"
          />
        </Typography.Paragraph>

        <Form
          form={form}
          labelCol={{ style: { width: 100 } }}
          onFieldsChange={(changes) => {
            let change
            if (
              (change = changes.find((change) => {
                // @ts-ignore
                return change.name?.find((x) => Object.keys(initialValue).includes(x))
              }))
            ) {
              setSetting((v) => ({ ...v, [change.name[0]]: change.value }))
            }
          }}
        >
          <Form.Item label={'分配于'} name={'assignee'}>
            <UserSuggest jiraApi={jiraApi!} />
          </Form.Item>
          {!!parents.length && (
            <Form.Item label={'分配父Issue'} name={'assigneeParentTask'} valuePropName={'checked'}>
              <Switch />
            </Form.Item>
          )}
          {!!subtasks.length && (
            <Form.Item label={'分配子Issue'} name={'assigneeSubTask'} valuePropName={'checked'}>
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Spin>
    </Modal>
  )
}

function HotKey() {
  const [setting] = useSharedValue('jira-extension-setting')
  const token = useToken()
  const jiraApi = useJiraApi()

  React.useEffect(() => {
    if (!setting?.overwriteShortcut || !token) {
      return
    }
    const m = new HotKeyChainManager(window.document as any)
      .on('a', (event: KeyboardEvent, next) => {
        // @ts-ignore
        if (!['TEXTAREA', 'INPUT'].includes(event.target.tagName) && event.target.contentEditable !== true) {
          event.preventDefault()
          const keys = getIssueKeys()
          if (!keys.length) {
            return
          }
          open((cb) => <AssignModal cb={cb} keys={keys} jiraApi={jiraApi} />)
        }

        next()
      })
      .start()
    return () => m.stop()
  }, [setting?.overwriteShortcut, token, jiraApi])

  return null
}

export default function hotkeyRender() {
  return pizza(HotKey)(getDom(), {})
}
