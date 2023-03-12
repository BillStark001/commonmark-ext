import { generalIsCodeBlockCategory, generalIsContainer, generalNeedsInlineParse, GeneralNodeType, NodeTypeDefinition } from 'commonmark';

export type ExtendedNodeType = GeneralNodeType 
  | 'table' | 'table_row' | 'table_head' | 'table_cell' 
  | 'math_block' | 'math_inline';

export const ExtendedNodeDefinition: NodeTypeDefinition<ExtendedNodeType> = {
  isContainer: (n) => {
    if (
      n.type === 'table' || 
      n.type === 'table_row' ||
      n.type === 'table_head' || 
      n.type === 'table_cell' 
    )
      return true;
    return generalIsContainer(n);
  },
  isCodeBlockCategory: function (t: ExtendedNodeType): boolean {
    return generalIsCodeBlockCategory(t) || t === 'math_block';
  },
  needsInlineParse: function (t: ExtendedNodeType): boolean {
    return generalNeedsInlineParse(t) || t === 'table_cell';
  }
};