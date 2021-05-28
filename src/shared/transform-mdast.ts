import { sync as visit } from '@moyuyc/visit-tree'

export default function transformMdast(
  node: any,
  {
    estimateRegExp
  }: {
    estimateRegExp?: RegExp
  } = {}
) {
  visit(
    node,
    (node, ctx) => {
      if (node.type === 'root') {
        return
      }
      if (node.type === 'listItem') {
        ctx.globalState.inList++
        return
      }
      if (ctx.globalState.inList > 0 || node.type === 'list') {
        return;
      }
      ctx.remove()
    },
    (node, ctx) => {
      if (node.type === 'listItem') {
        ctx.globalState.inList--
        return
      }

      if (
        ctx.globalState.inList === 1 &&
        node.type === 'text' &&
        ctx.parent &&
        ['listItem', 'paragraph'].includes(ctx.parent.type) &&
        node.value &&
        estimateRegExp
      ) {
        const matched = node.value.match(estimateRegExp)
        let listItem
        if (matched) {
          visit(
            ctx,
            (node, ctx) => {
              if (node.node.type === 'listItem') {
                listItem = node.node
                ctx.break()
              }
            },
            { path: 'parentCtx' }
          )

          if (listItem) {
            let estimate
            try {
              estimate = parseFloat(matched[1])
            } catch (e) {}
            if (estimate != null) {
              node.value = node.value.replace(estimateRegExp, '')

              listItem.data = {
                ...listItem.data,
                estimate,
                hProperties: {
                  ...listItem.data?.hProperties,
                  'data-estimate': estimate
                }
              }
            }
          }
        }
      }
    },
    {
      state: {
        inList: 0
      }
    }
  )
}
