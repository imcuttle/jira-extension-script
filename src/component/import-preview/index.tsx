import React, { useReducer } from 'react'
import { Button, Dropdown, Menu, Input, Modal, Drawer, Typography } from 'antd'
import p from 'prefix-classname'
import 'github-markdown-css/github-markdown.css'

const cn = p()
const c = p('jira_import-preview')

import './style.sass'
import remark from 'remark'
import stripMdast from '../../shared/strip-mdast'
import html from 'remark-html'
import {processor} from "../../shared/mdast-stringify";

const JiraImportPreview = React.forwardRef<
  {
    mdast: any
  },
  {
    markdown: string
  }
>(({ markdown }, ref) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'setType':
        return { ...state, type: action.value }
      case 'setData':
        return { ...state, data: action.value }
      default:
        return { ...state, ...action.value }
    }
  }, {})

  const mdast = React.useMemo(() => {
    const node = processor().data('settings', { position: false }).parse(markdown)
    stripMdast(node)
    return node
  }, [markdown])
  const htmlText = React.useMemo(() => processor().use(html).stringify(mdast), [mdast])

  React.useImperativeHandle(ref, () => ({
    mdast: mdast?.children
  }), [mdast])

  return (
    <div className={c()}>
      <div className={cn('markdown-body')} dangerouslySetInnerHTML={{ __html: htmlText }} />
    </div>
  )
})

export default JiraImportPreview
