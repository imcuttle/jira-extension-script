import React, { useState } from 'react'
import { Button, Form, InputNumber, Modal, notification, Spin, Table, Tooltip, Typography } from 'antd'
import { isNotIssueReady, isNotReady, useJiraApi, useLocationQuery, useSharedValue, useToken } from '../shared/utils'
import setIntervalCheck from 'interval-check'
import domify from 'domify'
import groupBy from 'lodash.groupby'
import openReactStandalone from '@rcp/util.open'
import { EllipsisOutlined } from '@ant-design/icons'
import usePersistFn from '../shared/hooks/use-persist-fn'
import { pizza } from '../shared/pizza'
import { css } from '@emotion/css'

const initialVal = {
  overwriteStoryPoints: true
}

const StoryPointerComponent: React.FC<{ sprintId: number; originShow: any }> = function ({ originShow, sprintId }) {
  const jiraApi = useJiraApi()
  const { rapidView } = useLocationQuery() || {}
  const [setting] = useSharedValue('jira-extension-setting', initialVal)
  const [loading, setLoading] = React.useState(false)

  const click = usePersistFn(async () => {
    if (!setting.overwriteStoryPoints) {
      return originShow()
    }

    setLoading(true)
    const response = await jiraApi.getBacklogData(rapidView as any, JIRA.API.Projects.getCurrentProjectKey())
    const activeSprint = response.data?.sprints?.find((sprint) => sprint.id === sprintId)

    if (activeSprint) {
      const getIssue = (id) => response.data.issues.find((issue) => issue.id === id) as any
      const issuesResponse = await jiraApi.search(
        `key in (${activeSprint.issuesIds.map((id) => getIssue(Number(id))?.key).join(',')})`
      )
      const issues = issuesResponse.data.issues

      const getSubTasks = async (is) => {
        if (is.fields.subtasks?.length) {
          const issuesResponse = await jiraApi.search(
            `key in (${(is.fields.subtasks || []).map((sub) => sub.key).join(',')})`
          )
          return issuesResponse.data.issues || []
        }
        return []
      }

      const asyncTasks: any[] = []

      const groups = groupBy(issues, 'fields.assignee.name')
      const data: any[] = []

      const storyPointsMap = {}

      for (const [assignee, group] of Object.entries(groups) as [any, any[]]) {
        for (const issue of group) {
          const issueInfo = getIssue(Number(issue.id))
          if (!issueInfo || !issueInfo.estimateStatistic) {
            continue
          }
          storyPointsMap[assignee] = storyPointsMap[assignee] || 0

          const estimateStatistic = issueInfo.estimateStatistic.statFieldValue?.value || 0

          // customfield_10704 => 前端工作量
          let frontPoints: number = issue.fields.customfield_10704
          if (frontPoints == null && issue.fields.summary) {
            if (/[(（]?(\d+)\+\d+[)）]?\s*$/.test(issue.fields.summary)) {
              frontPoints = Number(RegExp.$1)
            }
          }
          frontPoints = frontPoints || 0

          asyncTasks.push(async () => {
            if (frontPoints) {
              const otherAssignee = (await getSubTasks(issue)).find(
                (subTask) =>
                  subTask.fields?.assignee?.name && subTask.fields?.assignee?.name !== issue.fields?.assignee?.name
              )?.fields?.assignee?.name
              if (!otherAssignee) {
                storyPointsMap[assignee] += estimateStatistic
              } else {
                storyPointsMap[otherAssignee] = storyPointsMap[otherAssignee] || 0
                const backPoints = estimateStatistic - frontPoints
                if (backPoints >= frontPoints) {
                  storyPointsMap[assignee] += backPoints
                  storyPointsMap[otherAssignee] += frontPoints
                } else {
                  storyPointsMap[assignee] += frontPoints
                  storyPointsMap[otherAssignee] += backPoints
                }
              }
            } else {
              storyPointsMap[assignee] += estimateStatistic
            }
          })
        }

        if (!group[0]?.fields?.assignee) {
          data.unshift({
            key: group[0]?.fields?.assignee || 'noop',
            assignee: null,
            issueCount: group.length
          })
        } else {
          data.push({
            key: group[0].fields.assignee.name,
            assignee: group[0].fields.assignee,
            issueCount: group.length
          })
        }
      }

      await Promise.all(asyncTasks.map((fn) => fn()))

      openReactStandalone((cb) => (
        <Modal
          maskClosable={false}
          width={560}
          visible
          title={`经办人工作量 - ${activeSprint.name}`}
          footer={null}
          onCancel={() => cb(false)}
        >
          <Table
            rowKey={'key'}
            size={'small'}
            dataSource={data}
            pagination={false}
            columns={[
              {
                title: '经办人',
                // @ts-ignore
                render(val, row, index, data) {
                  if (!row.assignee) {
                    return '未分配'
                  }
                  return (
                    <>
                      <img
                        src={`https://jira.zhenguanyu.com/secure/useravatar?ownerId=${row.assignee?.key}`}
                        className="ghx-avatar-img"
                        alt=""
                      />
                      <span style={{ marginLeft: 10 }}>{row?.assignee?.displayName}</span>
                    </>
                  )
                }
              },
              {
                title: '问题(个)',
                align: 'right',
                dataIndex: 'issueCount',
                sorter: (a, b) => a.issueCount - b.issueCount
              },
              {
                title: 'Story Points',
                align: 'right',
                render(val, row) {
                  return storyPointsMap[row?.assignee?.name] ?? '-'
                },
                defaultSortOrder: 'descend',
                sorter: (a, b) => (storyPointsMap[a?.assignee?.name] || 0) - (storyPointsMap[b?.assignee?.name] || 0)
              }
            ]}
            summary={(pageData) => {
              let totalIssueCount = 0
              let totalStoryPoints = 0

              pageData.forEach(({ issueCount, assignee }) => {
                totalIssueCount += issueCount
                totalStoryPoints += storyPointsMap[assignee?.name] || 0
              })

              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Typography.Text strong>总计：</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align={'right'} index={1}>
                      <Typography.Text strong>{totalIssueCount}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align={'right'} index={2}>
                      <Typography.Text strong>{totalStoryPoints}</Typography.Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )
            }}
          />
        </Modal>
      ))
    }

    setLoading(false)
  })

  if (!jiraApi) {
    return null
  }

  return (
    <Tooltip title={'查看已分配工作概要'} placement={'bottom'} getPopupContainer={(node) => node.parentElement}>
      <Button
        className={css`
          height: 20px;
          width: 28px;
          margin-right: 10px;
          margin-left: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        `}
        loading={loading}
        type={'text'}
        icon={<EllipsisOutlined />}
        onClick={click}
      />
    </Tooltip>
  )
}

let globalDispose: any

export default function storyPointersRender() {
  if (globalDispose) {
    globalDispose()
  }

  const handle = () => {
    const headers = document.querySelectorAll(`.ghx-backlog-header[data-sprint-id]`)
    if (!headers.length) {
      return
    }

    headers.forEach((header: any) => {
      const trigger = header.querySelector('.js-assigned-work-dialog-trigger')
      if (trigger && header.dataset.sprintId) {
        if (trigger.parentElement.querySelector('.jira-extension-story-pointers')) {
          return
        }
        const dom = domify(`<span class="jira-extension-story-pointers"></span>`)
        trigger.parentElement.append(dom)
        trigger.style.display = 'none'
        const sprintId = Number(header.dataset.sprintId)
        pizza(StoryPointerComponent)(dom, { sprintId, originShow: () => trigger.click() })
      }
    })
  }

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
