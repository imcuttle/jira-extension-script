import React, { useReducer } from 'react'
import { Button, Dropdown, Menu, Input, Modal } from 'antd'
import p from 'prefix-classname'

const cn = p()
const c = p('jira_portal')

import './style.sass'
import transformHtmlNormalized from "../../shared/transform-html-to-normlaized";

// oVAepkVKirY6N4chhxEUyn53An7qWbdM6MYTGP
const JiraPortal: React.FC<{}> = ({}) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'setType':
        return { ...state, type: action.value }
      default:
        throw new Error()
    }
  }, { type: null })

  const clickMenu = React.useCallback(({key}) => {
    dispatch({ type: 'setType', value: key })
  }, [])

  return (
    <div className={c()}>
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu onClick={clickMenu}>
            <Menu.Item key={'import'}>导入Story</Menu.Item>
          </Menu>
        }
      >
        <Button type={'primary'}>Jira 工具</Button>
      </Dropdown>

      <Modal visible={state.type === 'import'}>
        <Input.TextArea
          onPaste={(evt) => {
            const html = evt.clipboardData.getData('text/html')
            if (html) {
              const text = transformHtmlNormalized(html)
              if (text !== false) {
                evt.clipboardData.setData('text/plain', text)
              }
            }
            console.log(evt)
          }}
          cols={4}
        />
      </Modal>
    </div>
  )
}

export default JiraPortal
