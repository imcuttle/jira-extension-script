/**
 * jira browser script
 * @author 余聪
 */
import pizza from 'react-pizza'
import JiraPortal from './component/portal'

export const render = pizza(JiraPortal)

export { default as estimateRender } from './exports/estimate-render'
import { default as estimateRender } from './exports/estimate-render'

// @ts-ignore
window.JiraExtensionScript = {}
// @ts-ignore
window.JiraExtensionScript.render = render
// @ts-ignore
window.JiraExtensionScript.estimateRender = estimateRender
