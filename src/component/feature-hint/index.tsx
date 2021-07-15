import { useSharedValue } from '../../shared/utils'
import React from 'react'
import { Popover, Tooltip, Typography } from 'antd'
import { css } from '@emotion/css'

export default function FeatureHint({ children, uniqKey }: any) {
  const [isFirst, setIsFirst] = useSharedValue(`jira-extension-feature-hint:${uniqKey}`, true)

  if (isFirst) {
    return (
      <Popover
        placement={'leftTop'}
        content={
          <>
            <Typography.Title level={5}>新功能支持</Typography.Title>
            <ul
              className={css`
                padding-left: 18px;
                margin-bottom: 0;
              `}
            >
              <li>批量设置经办人</li>
              <li>批量设置子任务经办人</li>
              <li>Active Sprint Kanban 展示经办人 & 分值</li>
              <li>估分分值明细详细计算</li>
            </ul>
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
