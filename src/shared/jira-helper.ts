import uniq from 'lodash.uniq'

export function getIssueKeys() {
  const elements = document.querySelectorAll(`.ghx-selected[data-issue-key]`)

  const issues = JIRA.Issue.getIssueKey() ? [JIRA.Issue.getIssueKey()] : []

  if (elements.length) {
    return uniq(Array.from(elements).map((elem) => elem.getAttribute('data-issue-key')).concat(issues)).filter(Boolean)
  }

  return issues
}
