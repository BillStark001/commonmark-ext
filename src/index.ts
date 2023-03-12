import { Node, NodeTypeDefinition, generalIsContainer, BlockParsingOptions, compileMaybeSpecialRegExp, HtmlRenderingOptions, HtmlRenderer, BlockParser, generalIsCodeBlockCategory, generalNeedsInlineParse } from 'commonmark';
import { ExtendedNodeType } from './parse/common';
import { MathHandler, MathTrigger } from './parse/math';
import { TableTrigger, TableHandler, TableHeadHandler, TableRowHandler, TableCellHandler, TableCellContent } from './parse/table';



export const ExtendedNodeDefinition: NodeTypeDefinition<ExtendedNodeType> = {
  isContainer: (n) => {
    if (n.type === 'table' || n.type === 'table_row' || n.type === 'table_head' || n.type === 'math_block')
      return true;
    return generalIsContainer(n);
  },
  isCodeBlockCategory: function (t: ExtendedNodeType): boolean {
    return generalIsCodeBlockCategory(t) || t === 'math_block';
  },
  needsInlineParse: function (t: ExtendedNodeType): boolean {
    return generalNeedsInlineParse(t) || t === 'table';
  }
};


const options: BlockParsingOptions<ExtendedNodeType> = {
  type: ExtendedNodeDefinition,
  blockHandlers: {
    table: TableHandler,
    table_head: TableHeadHandler,
    table_row: TableRowHandler,
    table_cell: TableCellHandler,

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

  table_cell(node: Node<ExtendedNodeType>, entering: boolean) {
    const { align, isHeader } = node.customData as TableCellContent;
    const tag = isHeader ? 'th' : 'td';
    const content =  `<${tag}${align ? ' align=' + JSON.stringify(align) : ''}>${node._string_content}</${tag}>`;
    this.lit(content);
    this.cr();
  }

  table(node: Node<ExtendedNodeType>, entering: boolean) {
    this.lit(entering ? '<table>' : '</table>');
    if (entering)
      this.cr();
  }

  table_head(node: Node<ExtendedNodeType>, entering: boolean) {
    this.lit(entering ? '<tr>' : '</tr>');
    this.cr();
  }
  table_row(node: Node<ExtendedNodeType>, entering: boolean) {
    this.lit(entering ? '<tr>' : '</tr>');
    this.cr();
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