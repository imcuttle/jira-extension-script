import pizza from 'react-pizza'
import { HotKeyChainManager } from 'hotkey-chain'
import lazy from 'lazy-value'
import React from 'react'
import open from '@rcp/util.open'

import { useJiraApi, useSharedValue, useToken } from '../shared/utils'
import { Form, Modal, notification, Spin, Switch, Tooltip, Typography } from 'antd'
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
  assigneeSubTask: true
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

  return (
    <Modal
      okText={'分配'}
      confirmLoading={isLoading}
      visible
      title={'分配任务'}
      onOk={async () => {
        const values = await form.validateFields()
        if (values) {
          try {
            await (jiraApi as JiraApiBrowser).setAssignees(
              keys.map((issueIdOrKey) => ({
                issueIdOrKey,
                assignee: values.assignee
              }))
            )
            if (values.assigneeSubTask) {

            }
            notification.success({
              message: '分配任务成功'
            })
          } catch (e) {
            notification.success({
              message: '分配任务失败'
            })
          }
        }
      }}
      onCancel={() => cb(false)}
    >
      <Spin spinning={isLoading}>
        <Typography.Paragraph>
          分配{' '}
          {keys.map((key) => (
            <Tooltip key={key} title={data.find((x) => x.key === key)?.fields?.summary}>
              <Typography.Link
                strong
                href={`/browse/${key}`}
                target={'_blank'}
                style={{ paddingLeft: 3, paddingRight: 3 }}
              >
                {key}
              </Typography.Link>
            </Tooltip>
          ))}{' '}
          任务
        </Typography.Paragraph>
        <Form
          form={form}
          labelCol={{ style: { width: 80 } }}
          onFieldsChange={(changes) => {
            let change
            if (
              (change = changes.find((change) => {
                // @ts-ignore
                return change.name?.includes('assigneeSubTask')
              }))
            ) {
              setSetting((v) => ({ ...v, assigneeSubTask: change.value }))
            }
          }}
        >
          <Form.Item label={'分配于'} name={'assignee'}>
            <UserSuggest jiraApi={jiraApi!} />
          </Form.Item>
          <Form.Item label={'分配子任务'} name={'assigneeSubTask'} valuePropName={'checked'}>
            <Switch />
          </Form.Item>
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
    if (!setting?.overwriteShortCut || !token) {
      return
    }
    const m = new HotKeyChainManager(window.document as any)
      .on('a', (event: KeyboardEvent, next) => {
        // @ts-ignore
        if (event.target.tagName === 'BODY') {
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
  }, [setting?.overwriteShortCut, token, jiraApi])

  return null
}

export default function hotkeyRender() {
  return pizza(HotKey)(getDom(), {})
}
