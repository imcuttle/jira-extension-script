import { useSharedValue } from '../../shared/utils'
import React from 'react'
import { Popover, Tooltip, Typography } from 'antd'
import { css } from '@emotion/css'

export default function FeatureHint({ children, uniqKey = '2' }: any) {
  const [isFirst, setIsFirst] = useSharedValue(`jira-extension-feature-hint:${uniqKey}`, true)

  if (isFirst) {
    return (
      <Popover
        overlayStyle={{
          zIndex: 900
        }}
        placement={'leftTop'}
        content={
          <>
            <Typography.Title level={5}>新功能支持</Typography.Title>
            <ol
              className={css`
                padding-left: 18px;
                margin-bottom: 0;
              `}
            >
              <li>批量导入支持公共描述</li>
              <li>批量导入支持统一 Issue 前缀</li>
            </ol>
          </>
        }
        visible
        onVisibleChange={() => setIsFirst(false)}
      >
        {children}
      </Popover>
    )
  }

  return children
}
