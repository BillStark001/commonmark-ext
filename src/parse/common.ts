import { GeneralNodeType } from 'commonmark';

export type ExtendedNodeType = GeneralNodeType 
  | 'table' | 'table_row' | 'table_head' | 'table_cell' 
  | 'math_block' | 'math_inline';
