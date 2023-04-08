import { BlockParsingOptions, compileMaybeSpecialRegExp } from 'commonmark';
import { ExtendedNodeType, ExtendedNodeDefinition } from './base/common';
import { parseInlineEmoji } from './base/emoji';
import { MathHandler, MathTrigger, parseInlineMathFence } from './base/math';
import { TableHandler, TableHeadHandler, TableRowHandler, TableCellHandler, TableTrigger } from './base/table';
import { parseInlineTemplate } from './base/template';

export { ExtendedNodeDefinition, ExtendedNodeType } from './base/common';

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

export { TableCellContent, TableAlignFormat, TableContent, TableReference } from './base/table';
export { compileTemplate, TemplateParams, TemplateParamsType } from './base/template';
export { generateAnchorFromTitle, HtmlParagraphDefinition, isHtmlRecordNode, mergeHtmlNodes } from './base/html';