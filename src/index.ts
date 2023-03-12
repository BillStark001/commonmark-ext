import { Node, BlockParsingOptions, compileMaybeSpecialRegExp, HtmlRenderingOptions, HtmlRenderer, BlockParser, compileNonSpecialCharRegExp } from 'commonmark';
import { ExtendedNodeDefinition, ExtendedNodeType } from './parse/common';
import { MathHandler, MathTrigger, parseInlineMathFence } from './parse/math';
import { TableTrigger, TableHandler, TableHeadHandler, TableRowHandler, TableCellHandler, TableCellContent } from './parse/table';






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
  reMaybeSpecial: compileMaybeSpecialRegExp('$', '|', true),
  reNonSpecialChars: compileNonSpecialCharRegExp('$', true),
  inlineHandlers: [
    ['$', parseInlineMathFence]
  ]
};

const renderingOptions: HtmlRenderingOptions<ExtendedNodeType> = {
  type: ExtendedNodeDefinition,
};


class ExtendedRenderer extends HtmlRenderer<ExtendedNodeType> {

  math_block(node: Node<ExtendedNodeType>) {
    this.lit('<pre><math>');
    this.lit(node._literal ?? '');
    this.lit('</math></pre>');
  }

  math_inline(node: Node<ExtendedNodeType>) {
    this.lit('<math>');
    this.lit(node._literal ?? '');
    this.lit('</math>');
  }

  table_cell(node: Node<ExtendedNodeType>, entering: boolean) {
    const { align, isHeader } = node.customData as TableCellContent;
    const tag = isHeader ? 'th' : 'td';
    const content =  entering ? 
      `<${tag}${align ? ' align=' + JSON.stringify(align) : ''}>` : 
      `</${tag}>`;
    this.lit(content);
    if (!entering){
      this.cr();
    }
  }

  table(node: Node<ExtendedNodeType>, entering: boolean) {
    this.lit(entering ? '<table>\n' : '</tbody>\n</table>');
  }

  table_head(node: Node<ExtendedNodeType>, entering: boolean) {
    this.lit(entering ? '<thead>\n<tr>' : '</tr>\n</thead>\n<tbody>');
    this.cr();
  }
  table_row(node: Node<ExtendedNodeType>, entering: boolean) {
    this.tag(entering ? 'tr' : '/tr');
    this.cr();
  }

}

const testMarkdown = `
| abc | def |
| --- | --- |
| bar | baz |
> bar

$$$$$
aaa
bbb
~~~~~~~
$$$$$
`;

const parser = new BlockParser(options);
const renderer = new ExtendedRenderer(renderingOptions);

const ast = parser.parse(testMarkdown);


// console.log(ast);
console.log(renderer.render(ast));