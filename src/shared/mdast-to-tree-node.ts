import TreeNode from './tree-node'
import mdastStringify from "./mdast-stringify";

function listItemNodeToTreeNode(listItem): TreeNode {
  const treeNode = new TreeNode()
  const pNode = listItem.children[0]
  treeNode.value = mdastStringify(pNode).trim()
  treeNode.children = mdastToTreeNodes(listItem.children.slice(1))
  return treeNode
}

export default function mdastToTreeNodes(mdast: any[]): TreeNode[] {
  const listNodes = mdast.filter((node) => node.type === 'list')
  const list = []
  listNodes.map((listNode) => {
    listNode.children.forEach((listItem) => {
      list.push(listItemNodeToTreeNode(listItem))
    })
  })
  return list
}
