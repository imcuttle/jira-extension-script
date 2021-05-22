import TreeNode from './tree-node'

const isBlockElem = (elem) => ['DIV', 'P', 'BR'].includes(elem?.tagName)

function generateText(domElem: Element) {
  if (!domElem) {
    return ''
  }

  if (domElem.tagName === 'S' || domElem.tagName === 'DEL') {
    return ''
  }

  const suffix = isBlockElem(domElem) ? '\n' : ''

  if (!domElem.childElementCount) {
    return (domElem.textContent || '') + suffix
  }

  let text = ''
  for (const childElem of domElem.children) {
    text += generateText(childElem)
  }
  return text + suffix
}

function generateTreeNode(domElem, parentTreeNode?: TreeNode) {
  if (domElem.tagName === 'LI') {
    const text = generateText(domElem).trim()
    if (text) {
      return new TreeNode(text)
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


export default function parseHtmlTreeNode(
  html: string,
): false | TreeNode {
  const docElement = new DOMParser().parseFromString(html, 'text/html')
  const ulElements = docElement.querySelectorAll('[data-shimo-docs] > ul')
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
