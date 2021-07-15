import React, { useReducer } from 'react'
import {
  Button,
  Dropdown,
  Menu,
  Input,
  Tooltip,
  Modal,
  Drawer,
  Typography,
  ConfigProvider,
  notification,
  Form,
  Switch
} from 'antd'
import p from 'prefix-classname'
import zhCN from 'antd/es/locale/zh_CN'

const cn = p()
const c = p('jira_portal')

import './style.sass'
import JiraModalImport from '../modal-import'
import {isNotReady, useSharedValue, useToken} from '../../shared/utils'
import FeatureHint from "../feature-hint";

const initialVal = {
  overwriteShortcut: true,
  overwriteStoryPoints: true
}

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
    { type: null, visible: false }
  )
  const [token, setToken] = useToken()

  if (isNotReady()) {
    console.error('JIRA defined load failed')
    return null
  }

  const [settingForm] = Form.useForm()
  const [setting, setSetting] = useSharedValue('jira-extension-setting', initialVal)

  return (
    <ConfigProvider locale={zhCN}>
      <div className={c()}>
        <FeatureHint>
          <Button
            className={c('__btn')}
            onClick={() => dispatch({ value: { visible: true } })}
            type={'dashed'}
            shape={'round'}
          >
            Jira 工具
          </Button>
        </FeatureHint>

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
              value={token as string}
              placeholder={'请设置 Jira Token'}
              onChange={(e) => {
                setToken(e.target.value)
              }}
            />

            <Typography.Paragraph style={{ marginTop: 20 }}>
              <Typography.Text style={{ fontWeight: 'bold', fontSize: 18 }}>工具包</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Button disabled={!token} type={'primary'} onClick={() => dispatch({ type: 'setType', value: 'import' })}>
                石墨 / Markdown 导入
              </Button>
            </Typography.Paragraph>

            <Typography.Paragraph style={{ marginTop: 20, marginBottom: 4 }}>
              <Typography.Text style={{ fontWeight: 'bold', fontSize: 18 }}>设置</Typography.Text>
            </Typography.Paragraph>
            <Form
              form={settingForm}
              initialValues={setting}
              labelCol={{ style: { width: 100 } }}
              onFieldsChange={(v, ...a) => {
                setSetting(settingForm.getFieldsValue())
              }}
            >
              <Form.Item help={'是否覆盖原始的快捷键，如 A'} name={'overwriteShortcut'} label={'快捷键覆盖'} valuePropName={'checked'}>
                <Switch disabled={!token} />
              </Form.Item>
              <Form.Item help={'是否覆盖原始的估分明细'} name={'overwriteStoryPoints'} label={'估分明细覆盖'} valuePropName={'checked'}>
                <Switch disabled={!token} />
              </Form.Item>
            </Form>
          </div>
        </Drawer>

        <JiraModalImport
          zIndex={1010}
          token={state.token}
          visible={state.type === 'import'}
          onCancel={() => dispatch({ type: 'setType', value: null })}
          title={'石墨 / Markdown 导入'}
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
