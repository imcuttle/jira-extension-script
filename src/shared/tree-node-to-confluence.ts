import TreeNode from "./tree-node";

export default function treeNodesToConfluence(treeNodes: TreeNode[], prefix = '*') {
  const chunks = []
  treeNodes.forEach(treeNode => {
    if (treeNode.value) {
      chunks.push(prefix + ' ' + treeNode.value)
    }

    const string = treeNodesToConfluence(treeNode.children, '*' + prefix)
    if (string) {
      chunks.push(string)
    }
  })

  return chunks.join('\n')
}
