import { BlockParsingOptions, compileMaybeSpecialRegExp } from 'commonmark';
import { ExtendedNodeType, ExtendedNodeDefinition } from './base/common';
import { parseInlineEmoji } from './syntax/emoji';
import { MathHandler, MathTrigger, parseInlineMathFence } from './syntax/math';
import { TableHandler, TableHeadHandler, TableRowHandler, TableCellHandler, TableTrigger } from './syntax/table';
import { parseInlineTemplate } from './syntax/template';

export { 
  ExtendedNodeDefinition, 
  type ExtendedNodeType 
} from './base/common';

export const ExtendedSyntaxOptions: BlockParsingOptions<ExtendedNodeType> = {
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
  // reNonSpecialChars: compileNonSpecialCharRegExp('$', true),
  inlineHandlers: [
    ['$', parseInlineMathFence],
    ['@', parseInlineTemplate],
    [':', parseInlineEmoji],
  ]
};

// definitions

export type {
  TableCellContent, 
  TableAlignFormat, 
  TableContent, 
  TableReference
} from './syntax/table';
export {
  compileTemplate, 
  type TemplateParams, 
  type TemplateParamsType
} from './syntax/template';
export {
  generateAnchorFromTitle, 
  type HtmlParagraphDefinition, 
  isHtmlRecordNode, 
  mergeHtmlNodes
} from './syntax/html';


// macro & nav

export * from './base/macro';
export * from './base/nav';

export {
  type LayDownRenderingContext,
  type RenderFunction, 
  LayDownRenderer
} from './renderer';