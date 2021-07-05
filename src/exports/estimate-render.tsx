import pizza from 'react-pizza'
import React, { useState } from 'react'
import { Form, InputNumber, notification, Spin } from 'antd'
import { isNotIssueReady, isNotReady, useToken } from '../shared/utils'
import JiraApiBrowser from '../shared/jira-api-browser'

const EstimateComponent: React.FC<{}> = function () {
  const [form] = Form.useForm()
  const [token] = useToken()
  const [loading, setLoading] = useState(false)
  const jiraApi = React.useMemo(
    () =>
      new JiraApiBrowser({
        password: token
      }),
    [token]
  )
  const update = () => {
    if (loading) {
      return
    }
    setLoading(true)
    jiraApi.updateIssue(JIRA.Issue.getIssueId(), form.getFieldsValue()).finally(() => {
      setLoading(false)
    })
  }

  React.useEffect(() => {
    if (JIRA.Issue.getIssueKey()) {
      jiraApi.queryIssue(JIRA.Issue.getIssueKey()).then((res: any) => {
        if (res.data.fields) {
          form.setFieldsValue({
            estimate: res.data.fields.customfield_10002
          })
        }
      })
    }
  }, [JIRA.Issue.getIssueKey()])

  if (!token || isNotReady() || isNotIssueReady()) {
    return null
  }

  return (
    <Form form={form} style={{ marginTop: 15 }} size={'small'} layout={'inline'}>
      <Form.Item name={'estimate'} label={'Estimate'} labelCol={{ style: { width: 90 } }}>
        <Spin spinning={loading} delay={500}>
          <InputNumber onBlur={update} />
        </Spin>
      </Form.Item>
    </Form>
  )
}

export default function estimateRender() {
  const alreadyHad =
    document.querySelector('#ghx-detail-head .ghx-estimate') ||
    document.querySelector(`#stalker .command-bar .jira-extension-estimate`)
  if (alreadyHad) {
    return
  }

  const container = document.querySelector(`#stalker .command-bar`)
  if (!container) {
    return
  }

  const div = document.createElement('div')
  div.classList.add('jira-extension-estimate')
  container.appendChild(div)

  return pizza(EstimateComponent)(div, {})
}
