import uniq from 'lodash.uniq'
import get from 'lodash.get'

export function getIssueKeys() {
  const elements = document.querySelectorAll(`.ghx-selected[data-issue-key]`)

  const issues = JIRA.Issue?.getIssueKey?.() ? [JIRA.Issue.getIssueKey()] : []

  if (elements.length) {
    return uniq(
      Array.from(elements)
        .map((elem) => elem.getAttribute('data-issue-key'))
        .concat(issues)
    ).filter(Boolean)
  }

  return issues
}


export function reloadDetailView() {
  if (typeof GH !== 'undefined' && GH?.DetailsView?.reload) {
    GH?.DetailsView?.reload()
  } else {
    const issueKey = JIRA.Issue.getIssueKey()
    const backlogContainer = document.querySelector('#ghx-rabid')
    if (backlogContainer) {
      const itemDom: HTMLDivElement = backlogContainer.querySelector(
        `[data-issue-key=${JSON.stringify(issueKey)}]`
      )
      if (itemDom && itemDom.click) {
        itemDom.click()
      }
    } else {
      // 详情页
      JIRA.Issue?.reload?.()
    }
  }
}

export function reloadIssue(id: number) {
  AJS.$(GH).trigger('issueUpdated', {
    issueId: id,
    source: 'detailView'
  })
}
