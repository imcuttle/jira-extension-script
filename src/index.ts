/**
 * jira browser script
 * @author 余聪
 */
import pizza from 'react-pizza'
import JiraPortal from './component/portal'

export const render = pizza(JiraPortal)

export { default as estimateRender } from './exports/estimate-render'
import { default as estimateRender } from './exports/estimate-render'

// dev 环境开了 hot-client 所以 umd 打包 export 有问题，所以用这种方式解决
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
// @ts-ignore
  window.JiraExtensionScript = {}
// @ts-ignore
  window.JiraExtensionScript.render = render
// @ts-ignore
  window.JiraExtensionScript.estimateRender = estimateRender
}
