import React, { useReducer } from 'react'
import { Button, Dropdown, Menu, Input, Modal, Drawer, Typography, ConfigProvider, notification } from 'antd'
import p from 'prefix-classname'
import lodashGet from 'lodash.get'
import zhCN from 'antd/es/locale/zh_CN'

const cn = p()
const c = p('jira_portal')

import './style.sass'
import JiraModalImport from '../modal-import'

// oVAepkVKirY6N4chhxEUyn53An7qWbdM6MYTGP
const JiraPortal: React.FC<{}> = ({}) => {
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'setType':
          return { ...state, type: action.value }
        case 'setData':
          return { ...state, data: action.value }
        default:
          return { ...state, ...action.value }
      }
    },
    { type: null, visible: true, token: localStorage.getItem('jira:api-token') }
  )

  React.useEffect(() => {
    localStorage.setItem('jira:api-token', state.token)
  }, [state.token])

  if (
    typeof JIRA === 'undefined' ||
    !lodashGet(JIRA, 'Users.LoggedInUser.userName', () => undefined)() ||
    !lodashGet(JIRA, 'API.Projects.getCurrentProjectKey', () => undefined)()
  ) {
    console.error('JIRA defined load failed')
    return null
  }

  return (
    <ConfigProvider locale={zhCN}>
      <div className={c()}>
        <Button onClick={() => dispatch({ value: { visible: true } })} type={'dashed'} shape={'round'}>
          Jira 工具
        </Button>

        <Drawer
          onClose={() =>
            dispatch({
              value: { visible: false }
            })
          }
          width={360}
          title="Jira 工具"
          placement="right"
          visible={state.visible}
          className={c('__drawer')}
        >
          <div>
            <Typography.Paragraph>
              进入{' '}
              <a href={'/plugins/servlet/de.resolution.apitokenauth/admin'} target={'_blank'}>
                Jira token 设置页
              </a>
            </Typography.Paragraph>
            <Input.Password
              name={'jira-token'}
              value={state.token}
              placeholder={'Jira Token'}
              onChange={(e) => {
                dispatch({
                  value: {
                    token: e.target.value
                  }
                })
              }}
            />

            <Typography.Paragraph style={{ marginTop: 20 }}>
              <Typography.Text style={{ fontWeight: 'bold', fontSize: 18 }}>工具包</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Button type={'primary'} onClick={() => dispatch({ type: 'setType', value: 'import' })}>
                石墨 / Markdown 导入
              </Button>
            </Typography.Paragraph>
          </div>
        </Drawer>

        <JiraModalImport
          token={state.token}
          visible={state.type === 'import'}
          onCancel={() => dispatch({ type: 'setType', value: null })}
        />
      </div>
    </ConfigProvider>
  )
}

export default JiraPortal

/*
*   git 仓库搭建
*   前端开发环境配置
    *   webpack config
    *   tsconfig
    *   tslint
    *   babel-loader & babel plugin
    *   image / font 字体加载
    *   antd 引入
*   前端开发规范设计
    *   目录结构设计、划分
        *   bk/
        *   buss/
                models
                pages/

 */
