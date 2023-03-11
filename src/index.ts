import { Node, NodeTypeDefinition, generalIsContainer, BlockParsingOptions, compileMaybeSpecialRegExp, HtmlRenderingOptions, HtmlRenderer, BlockParser } from 'commonmark';
import { ExtendedNodeType } from './parse/common';
import { MathHandler, MathTrigger } from './parse/math';
import { TableTrigger, TableAlignFormat, TableContent, TableHandler } from './parse/table';



export const ExtendedNodeDefinition: NodeTypeDefinition<ExtendedNodeType> = {
  isContainer: (n) => {
    if (n.type === 'table' || n.type === 'math_block')
      return true;
    return generalIsContainer(n);
  }
};


const options: BlockParsingOptions<ExtendedNodeType> = {
  type: ExtendedNodeDefinition,
  blockHandlers: {
    table: TableHandler,
    math_block: MathHandler,
  },
  blockStartHandlers: {
    [-1]: [TableTrigger],
    [2]: [MathTrigger],
  },
  reMaybeSpecial: compileMaybeSpecialRegExp('$', '|'),
};

const renderingOptions: HtmlRenderingOptions<ExtendedNodeType> = {
  type: ExtendedNodeDefinition,
};


class ExtendedRenderer extends HtmlRenderer<ExtendedNodeType> {

  math_block(node: Node<ExtendedNodeType>, entering: boolean) {
    if (entering) {
      this.lit('<pre><math>');
      this.lit(node._literal ?? '');
      this.lit('</math></pre>');
    }
  }

  table_cell(node: Node<ExtendedNodeType>, entering: boolean, content?: string, align?: TableAlignFormat, head?: boolean) {
    const tag = head ? 'th' : 'td';
    return `<${tag}${align ? ' align=' + JSON.stringify(align) : ''}>${content}</${tag}>`;
  }

  table(node: Node<ExtendedNodeType>, entering: boolean) {
    if (entering) {
      const content = node.customData as TableContent;
      this.lit(`<table>
<thead>
<tr>
${content.header.map((x, i) => this.table_cell(node, entering, x, content.format[i], true)).join('\n')}
</tr>
</thead>
<tbody>
${content.body.map(b => `<tr>
${b.slice(0, content.header.length).map((x, i) => this.table_cell(node, entering, x, content.format[i], false)).join('\n')}
</tr>`)}
<tr>
<td>b <strong>|</strong> im</td>
</tr>
</tbody>
</table>`);
    }
  }

}

const testMarkdown = `
aaaa

-|

| 1|2|3\\||4|
   -|-:|:-| :-:
  5|6|7
  8 | 999
--------
> 2
> 3
| abc | defghi |
:-: | -----------:
bar | baz

gan si $huang-xu-dong$ 
bai qiu \`dai chong feng\`

$$$$$$
gan si huang xu dong
$$$$$$
~~~~~~
gan si huang xu dong
~~~~~~

dddd
`;

const parser = new BlockParser(options);
const renderer = new ExtendedRenderer(renderingOptions);

const ast = parser.parse(testMarkdown);


// console.log(ast);
console.log(renderer.render(ast));