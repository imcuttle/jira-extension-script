import TreeNode from './tree-node'

export function treeNodeToMdastListItem(treeNode: TreeNode) {
  return {
    type: 'listItem',
    spread: false,
    checked: null,
    children: [
      treeNode.value && { type: 'text', value: treeNode.value },
      {
        type: 'list',
        spread: false,
        start: null,
        ordered: false,
        children: treeNode.children.map((child) => treeNodeToMdastListItem(child))
      }
    ]
  }
}

export default function treeNodeToMdast(treeNode: TreeNode) {
  return {
    type: 'list',
    spread: false,
    start: null,
    ordered: false,
    children: treeNode.children.map((child) => treeNodeToMdastListItem(child))
  }
}
