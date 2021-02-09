import visit from '@moyuyc/visit-tree'

export default function transformHtmlNormalized(html: string): false | string {
  const docElement = new DOMParser().parseFromString(html, 'text/html')
  const ulElement = docElement.querySelector('[data-shimo-docs] > ul')
  if (!ulElement) {
    // 不匹配石墨
    return false
  }

  visit<Element, void>(
    ulElement,
    // pre visitor
    (node, ctx) => {

    },
    // post visitor
    (node, ctx) => {},
    {
      path: 'children'
    }
  )
  return false
}
