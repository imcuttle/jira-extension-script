/**
 * jira browser script
 * @author 余聪
 */
import pizza from 'react-pizza'
import JiraPortal from './component/portal'

export const render = pizza(JiraPortal)

// @ts-ignore
window.JiraExtensionScript = {}
// @ts-ignore
window.JiraExtensionScript.render = render
