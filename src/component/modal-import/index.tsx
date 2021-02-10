import React, { useReducer } from 'react'
import { Button, Dropdown, Menu, Input, Modal, Drawer, Typography, ModalProps } from 'antd'
import p from 'prefix-classname'
import isHotKey from 'is-hotkey'
import 'github-markdown-css/github-markdown.css'

const cn = p()
const c = p('jira_modal-import')

import './style.sass'
import remark from 'remark'
import JiraApiBrowser from '../../shared/jira-api-browser'
import parseHtmlTreeNode from '../../shared/parse-html-treenode'
import treeNodeToMdast from '../../shared/tree-node-to-mdast'
import JiraImportPreview from '../import-preview'
import mdastToTreeNodes from '../../shared/mdast-to-tree-node'
import { markdown2confluence } from '../../shared/markdown-to-confluence'
import mdastStringify from '../../shared/mdast-stringify'

const JiraModalImport = React.forwardRef<
  {},
  {
    token: string
  } & ModalProps
>(({ token, ...props }, ref) => {
  React.useImperativeHandle(ref, () => ({}), [])
  const importPreviewRef = React.useRef(null)
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const onImportInputKeydown = React.useCallback((evt) => {
    const isCollapsed = evt.target.selectionEnd === evt.target.selectionStart
    if (isCollapsed && isHotKey('tab', evt)) {
      document.execCommand('insertText', false, '  ')
      evt.preventDefault()
    }
  }, [])

  return (
    <Modal
      className={c()}
      title={'导入jira'}
      {...props}
      confirmLoading={loading}
      onOk={async (e) => {
        const mdast = importPreviewRef.current?.mdast
        if (mdast) {
        }

        const nodes = mdastToTreeNodes(mdast)
        console.log(mdast, nodes)
        const jiraApi = new JiraApiBrowser({
          password: token
        })
        setLoading(true)
        const res = await jiraApi.createIssues({
          tasksBody: nodes.map((node) => ({
            // estimate?: number
            summary: node.value,
            description: markdown2confluence(mdastStringify(treeNodeToMdast(node)).trim())
          }))
        })
        setLoading(false)
        if (res.data.issues && res.data.issues.length) {
          // props.onCancel && props.onCancel(e)
        }
      }}
      width={1200}
    >
      <div className={c('__import-wrapper')}>
        <Input.TextArea
          onKeyDown={onImportInputKeydown}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
          }}
          placeholder={'输入 markdown 或者复制 石墨文档内容至此'}
          className={c('__import-left')}
          onPaste={(evt) => {
            const html = evt.clipboardData.getData('text/html')
            if (html) {
              const treeNode = parseHtmlTreeNode(html)
              if (treeNode !== false) {
                const mdast = treeNodeToMdast(treeNode)
                const mdText = mdastStringify(mdast)
                console.log({ mdast, mdText, treeNode })
                evt.preventDefault()
                document.execCommand('insertText', false, mdText)
              }
            }
          }}
          cols={12}
        />
        <div className={c('__import-right')}>
          <JiraImportPreview ref={importPreviewRef} markdown={input || ''} />
        </div>
      </div>
    </Modal>
  )
})

export default JiraModalImport
