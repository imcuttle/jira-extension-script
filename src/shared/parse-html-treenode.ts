import TreeNode from './tree-node'

const isBlockElem = (elem) => ['DIV', 'P', 'BR'].includes(elem?.tagName)

function generateText(domElem: Node) {
  if (!domElem) {
    return ''
  }
  if (domElem.nodeType === Node.TEXT_NODE) {
    return domElem.textContent
  }
  if (domElem.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }
  const elem = domElem as HTMLElement
  if (elem.tagName === 'S' || elem.tagName === 'DEL') {
    return ''
  }

  const suffix = isBlockElem(elem) ? '\n' : ''

  if (!elem.childElementCount) {
    return (elem.textContent || '') + suffix
  }

  let text = ''
  for (const childElem of elem.childNodes) {
    text += generateText(childElem)
  }
  return text + suffix
}

function generateTreeNode(domElem, parentTreeNode?: TreeNode) {
  if (domElem.tagName === 'LI') {
    domElem = domElem.cloneNode(true)
    const iter = document.evaluate('./ul/li|./ol/li', domElem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    const tNode = new TreeNode()
    let li
    let i = 0
    while (i < iter.snapshotLength) {
      const node = iter.snapshotItem(i)
      if (node) {
        tNode.addNode(generateTreeNode(node))
      }
      if (node && !li) {
        li = node
      }
      i++
    }
    li?.parentElement?.remove()

    const text = generateText(domElem).trim()
    if (text) {
      tNode.value = text
      return tNode
    }
    return null
  }

  const prevTreeNode = parentTreeNode?.children[parentTreeNode.children.length - 1]

  if (domElem.tagName === 'UL' || domElem.tagName === 'OL') {
    const treeNode = prevTreeNode || new TreeNode()
    for (const childElem of domElem.children) {
      treeNode.addNode(generateTreeNode(childElem, treeNode))
    }
    // 取消传入
    if (prevTreeNode) {
      return null
    }
    return treeNode
  }
  return null
}

export default function parseHtmlTreeNode(html: string): false | TreeNode {
  const docElement = new DOMParser().parseFromString(html, 'text/html')
  const ulElements = docElement.querySelectorAll('[data-shimo-docs] > ul, body > ul')
  if (!ulElements.length) {
    // 不匹配石墨
    return false
  }

  const treeNode = new TreeNode()
  ulElements.forEach((node) => {
    generateTreeNode(node).children.forEach((childNode) => {
      treeNode.addNode(childNode)
    })
  })

  return treeNode
}
