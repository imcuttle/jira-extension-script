import visit from '@moyuyc/visit-tree'

export default function stripMdast(node: any) {
  visit<any, any>(node, (node, ctx) => {
    if (node.type === 'root') {
      return
    }
    if (node.type === 'list') {
      return ctx.skip()
    }
    else {
      ctx.remove()
    }
  })
}
