import { Node, HtmlRenderingOptions, HtmlRenderer, BlockParser, NodeWalker, NodeWalkerEvent } from 'commonmark';
import { ExtendedNodeDefinition, ExtendedSyntaxOptions, ExtendedNodeType } from 'laydown';
import { HtmlParagraphDefinition, isHtmlRecordNode, mergeHtmlNodes, TemplateParams, TableCellContent } from 'laydown';


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

  html_paragraph(node: Node<ExtendedNodeType>, entering: boolean) {
    const { startTag, endTag, tagName } = node.customData as HtmlParagraphDefinition;
    if (entering)
      this.lit(startTag ?? (tagName && `<${tagName}>`) ?? '');
    else 
      this.lit(endTag ?? (tagName && `</${tagName}>`) ?? '');
  }

  html_paragraph_text(node: Node<ExtendedNodeType>) {
    this.text(node);
  }

  template(node: Node<ExtendedNodeType>) {
    const { name, args, kwargs } = node.customData as TemplateParams;
    this.lit(`Template [${name}]: \n`);
    this.lit(`Arguments: ${JSON.stringify(args)} \n`);
    this.lit(`Keyword Arguments: ${JSON.stringify(kwargs)}`);
  }

}

const testMarkdown = `
<img src="../../Figures/index-3.jpg" width=100%;>
@[aaa](333, ddf, sada, 'sss', bbb = ccc, ddd = 'eee', 'fff' = 666.4e+12, hhh = undefined, kkk = false)
`;

const parser = new BlockParser(ExtendedSyntaxOptions);
const renderer = new ExtendedRenderer(renderingOptions);

const ast = parser.parse(testMarkdown);
const walker = new NodeWalker(ast, ExtendedSyntaxOptions.type);
let current: NodeWalkerEvent<ExtendedNodeType> | undefined = undefined;

walker.resumeAt(ast, true);
while ((current = walker.next()) !== undefined) {
  console.log(current.node.type, current.entering, current.node.literal, current.node.sourcepos);
}

walker.resumeAt(ast, true);
while ((current = walker.next()) !== undefined) {
  if (isHtmlRecordNode(current.node)) {
    const reducedNode = mergeHtmlNodes(current.node, 'html_paragraph', 'html_paragraph_text');
    walker.resumeAt(reducedNode, true);
  }
}

console.log();
walker.resumeAt(ast, true);
while ((current = walker.next()) !== undefined) {
  console.log(current.node.type, current.entering, current.node.literal, current.node.sourcepos);
}

console.log(renderer.render(ast));