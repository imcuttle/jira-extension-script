import React, { ReactNode, useReducer } from 'react'
import { Button, Dropdown, Menu, Input, Modal, Drawer, Typography, Select, SelectProps, Spin } from 'antd'
import p from 'prefix-classname'
import useUncontrolled from '@rcp/use.uncontrolled'
import 'github-markdown-css/github-markdown.css'

const cn = p()
const c = p('jira_epic-link')

import './style.sass'

type TOptions = Array<{ label: ReactNode; value: any } | any>

export const JiraSuggest = React.forwardRef<
  {},
  SelectProps<any> & {
    fetcher: (val: any) => Promise<{ [group: string]: TOptions } | TOptions | void>
    group?: boolean
    onChange?: (value: any) => void
    data?: any
    defaultData?: any
    onDataChange?: any
  }
>(({ group = false, fetcher, data: _data, defaultData, onDataChange, value, onChange, defaultValue, ...props }, ref) => {
  const [valueState, setValue] = useUncontrolled({
    value,
    defaultValue,
    onChange
  })
  const [data, setData] = useUncontrolled({
    value: _data,
    defaultValue: defaultData || group ? {} : [],
    onChange: onDataChange
  })
  const [loading, setLoading] = React.useState(false)

  const handleSearch = React.useCallback(
    async (value) => {
      const defaultData = group ? {} : []
      setLoading(true)
      const data = await fetcher(value)
      setLoading(false)
      if (!data) {
        setData(defaultData)
      } else {
        setData(data)
      }
    },
    [setData, setLoading, fetcher, group]
  )

  const options = React.useMemo(() => {
    const renderOptions = (data) =>
      data.map((d: any) => {
        if (d && typeof d === 'object') {
          return (
            <Select.Option key={d.value} value={d.value}>
              {d.label}
            </Select.Option>
          )
        }
        return (
          <Select.Option key={d} value={d}>
            {d}
          </Select.Option>
        )
      })

    if (!group) {
      // @ts-ignore
      return renderOptions(data)
    }

    return Object.keys(data).map((group) => {
      return (
        <Select.OptGroup label={group} key={group}>
          {renderOptions(data[group])}
        </Select.OptGroup>
      )
    })
  }, [data, group])

  return (
    <Select
      className={c()}
      showSearch
      defaultActiveFirstOption
      showArrow
      allowClear
      filterOption={false}
      onSearch={handleSearch}
      value={valueState}
      showAction={['focus']}
      onChange={setValue}
      notFoundContent={loading ? <Spin size="small" /> : null}
      {...props}
    >
      {options}
    </Select>
  )
})

const JiraEpicLink = React.forwardRef<
  {
    mdast: any
  },
  {}
>(({}, ref) => {
  return <div className={c()}></div>
})

export default JiraEpicLink
