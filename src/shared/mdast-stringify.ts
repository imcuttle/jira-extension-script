import unified from 'unified'
import parser from 'remark-parse'
import stringify from 'remark-stringify'


export const processor = unified().use(parser).use(stringify, {
  bullet: '-',
  fence: '~',
  fences: true,
  incrementListMarker: false
}).freeze()

export default function mdastStringify(mdast: any) {
  if (mdast.typeof !== 'root') {
    mdast = {
      type: 'root',
      children: [mdast]
    }
  }
  return processor.stringify(mdast)
}
