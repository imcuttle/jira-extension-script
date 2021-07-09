import { JiraSuggest } from '../epic-link-suggest'
import React, { ComponentProps } from 'react'
import { Avatar } from 'antd'
import p from 'prefix-classname'
import JiraApiBrowser from '../../shared/jira-api-browser'

const c = p('jira_user-suggest')

export default function UserSuggest({
  jiraApi,
  ...props
}: Partial<ComponentProps<typeof JiraSuggest>> & { jiraApi: JiraApiBrowser }) {
  const userFetcher = async (val) => {
    const res = await jiraApi.querySuggestUsers({
      query: val
    })
    return res.data.users.map((user) => {
      return {
        label: (
          <span className={c('__user-item')}>
            <Avatar style={{ width: 20, height: 20, marginRight: 4 }} src={user.avatarUrl} />
            <span
              style={{ width: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
              dangerouslySetInnerHTML={{ __html: user.html }}
            />
          </span>
        ),
        value: user.key
      }
    }, {})
  }

  return <JiraSuggest fetcher={userFetcher} {...props} />
}
