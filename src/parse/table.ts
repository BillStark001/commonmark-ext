import { Node, BlockHandler, BlockParser, StartingConditions, common, BlockStartsHandler } from 'commonmark';
import { ExtendedNodeType } from './common';

export type TableAlignFormat = 'left' | 'center' | 'right';

// const C_VERTICAL_BAR = 124;

export type TableContent = {
  header: string[],
  format: (TableAlignFormat | undefined)[],
  body: string[][],
};

const reTableSep = /^[ \t]*\|?[ \t]*(:?-+:?[ \t]*\|[ \t]*?)+[ \t]*(?::?-+:?)?[ \t]*$/;
const reLeadingSpace = /^[ \t]*/;
const reTrailingSpace = /[ \t]*$/;
const reVerticalBar = /(?<!\\)(?:\\\\)*(\|)/g;

// tool functions


export const matchVerticalBars = (s: string) => {
  let m: RegExpExecArray | null;
  const ret: number[] = [];
  reVerticalBar.lastIndex = 0;
  while ((m = reVerticalBar.exec(s))) {
    ret.push(m.index + m[0].length - 1);
  }
  return ret;
};

export const countColumns = (s: string, bars?: number[]): [number, boolean, boolean] => {
  bars = bars ?? matchVerticalBars(s);
  const leadingChar = s.match(reLeadingSpace)?.[0].length ?? 0;
  const trailingChar = s.length - (s.match(reTrailingSpace)?.[0].length ?? 0) - 1;
  let res = bars.length - 1;
  const cl = bars[0] !== leadingChar;
  const cr = bars[bars.length - 1] !== trailingChar;
  if (cl)
    res += 1;
  if (cr)
    res += 1;
  return [res, cl, cr];
};

export const splitRow = (s: string, bars?: number[], seps?: [number, boolean, boolean]) => {
  bars = bars ?? matchVerticalBars(s);
  const [cnt, leadingChar, trailingChar] = seps ?? countColumns(s, bars);
  let cursor = leadingChar ? 0 : bars[0] + 1;
  const ans: string[] = [];
  for (let i = 0; i < cnt; ++i) {
    const rightCursor = i == cnt - 1 ? 
      (trailingChar ? s.length : bars[bars.length - 1]) : 
      bars[i + 1 + - Number(leadingChar)];
    ans.push(s.slice(cursor, rightCursor).trim());
    cursor = rightCursor + 1;
  }
  return ans;
};

export const parseAlignFormat = (s: string): TableAlignFormat | undefined => {
  const f1 = s[0] === ':';
  const f2 = s[s.length - 1] === ':';
  if (f1 && f2)
    return 'center';
  else if (f1)
    return 'left';
  else if (f2)
    return 'right';
  return undefined;
};


// defs


export const TableHandler: BlockHandler<ExtendedNodeType> = {
  continue: function (parser: BlockParser<ExtendedNodeType>, block: Node<ExtendedNodeType>): 0 | 2 | 1 {
    if (block.sourcepos[0][0] == parser.lineNumber - 1) { // table sep
      parser.advanceOffset(parser.currentLine.length); // do nothing
      return 0;
    }
    const haltCondition =
      !reVerticalBar.test(parser.currentLine) ||
      StartingConditions.isTopLevelStarting(parser, block);
    if (!haltCondition) { // table row
      parser.advanceOffset(parser.currentLine.length);
      (block.customData as TableContent).body.push(splitRow(parser.currentLine).map(x => common.unescapeString(x)));
      return 0;
    }
    return 1;
  },
  finalize: function (): void {
    return;
  },
  canContain: function (t: ExtendedNodeType): boolean {
    return t === 'table_row' || t === 'table_head';
  },
  acceptsLines: true
};


export const TableTrigger: BlockStartsHandler<ExtendedNodeType> = (parser) => {
  if (!parser.indented && reTableSep.test(parser.nextLine) && parser.nextLine.indexOf('|') >= 0) {
    const currentBars = matchVerticalBars(parser.currentLine);
    const currentColumns = countColumns(parser.currentLine, currentBars);
    const nextBars = matchVerticalBars(parser.nextLine);
    const nextColumns = countColumns(parser.nextLine, nextBars);
    if (currentColumns[0] === nextColumns[0]) {
      // there is a GFM table
      parser.closeUnmatchedBlocks();
      // parser.advanceOffset(parser.currentLine.trim().length, false);
      const table = parser.addChild('table', parser.offset);
      table.customData = {
        header: splitRow(parser.currentLine, currentBars, currentColumns).map(x => common.unescapeString(x)),
        format: splitRow(parser.nextLine, nextBars, nextColumns).map(x => parseAlignFormat(x)),
        body: []
      } as TableContent;
      parser.advanceOffset(parser.currentLine.length);
      return 1;
    }
  }
  return 0;
};
