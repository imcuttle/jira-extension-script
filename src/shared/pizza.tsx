import React from 'react'
import originPizza from 'react-pizza'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'

export const pizza: typeof originPizza = (Comp) => {
  return originPizza((props) => (
    <ConfigProvider locale={zhCN}>
      <Comp {...props} />
    </ConfigProvider>
  ))
}
