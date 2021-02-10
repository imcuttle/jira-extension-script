class TreeNode<T = any> {
  public data = {}
  constructor(public value?: T, public children: TreeNode<T>[] = []) {}
  addNode(node?: TreeNode) {
    if (node) {
      this.children.push(node)
    }
  }
}

export default TreeNode
