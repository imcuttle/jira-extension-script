import React, { useReducer } from 'react'
import { Button, Dropdown, Menu, Input, Modal, Drawer, Typography } from 'antd'
import p from 'prefix-classname'
import 'github-markdown-css/github-markdown.css'

const cn = p()
const c = p('jira_import-preview')

import './style.sass'
import remark from 'remark'
import transformMdast from '../../shared/transform-mdast'
import html from 'remark-html'
import { processor } from '../../shared/mdast-stringify'

const x = (opts: any) => {
  return (node) => {
    console.log('node', node, opts)
  }
}

const JiraImportPreview = React.forwardRef<
  {
    mdast: any
  },
  {
    markdown: string
    parseOpts?: any
  }
>(({ parseOpts, markdown }, ref) => {
  const mdast = React.useMemo(() => {
    const node = processor().data('settings', { position: false }).parse(markdown)
    transformMdast(node, parseOpts)
    return node
  }, [markdown, parseOpts])
  const htmlText = React.useMemo(() => processor().use(html).stringify(mdast), [mdast])

  React.useImperativeHandle(
    ref,
    () => ({
      mdast: mdast?.children
    }),
    [mdast]
  )

  return (
    <div className={c()}>
      <div className={cn('markdown-body')} dangerouslySetInnerHTML={{ __html: htmlText }} />
    </div>
  )
})

export default JiraImportPreview
