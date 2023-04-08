import { Node, BlockStartsHandler, BlockHandler, common, InlineHandler, createTextnode } from 'commonmark';
import { ExtendedNodeType } from './common';


const reMathFence = /^\${2,}/;
const reClosingMathFence = /^\${2,}(?=[ \t]*$)/;

const reInlineMathFence = /\$+/g;
const reInlineMathFenceHere = /^\$+/g;

// const MATH_INDENT = 4;


export const MathTrigger: BlockStartsHandler<ExtendedNodeType> = (parser) => {
  let match: RegExpMatchArray | null;
  if (!parser.indented &&
    (match = parser.currentLine
      .slice(parser.nextNonspace)
      .match(reMathFence))
  ) {
    const fenceLength = match[0].length;
    parser.closeUnmatchedBlocks();
    const container = parser.addChild('math_block', parser.nextNonspace);
    container._isFenced = true;
    container._fenceLength = fenceLength;
    container._fenceChar = match[0][0];
    container._fenceOffset = parser.indent;
    parser.advanceNextNonspace();
    parser.advanceOffset(fenceLength, false);
    return 2;
  }
  return 0;
};

const isSpaceOrTab = (c: number) => {
  return c === 0x09 || c === 0x20;
};

const peek = (ln: string, pos: number) => {
  if (pos < ln.length) {
    return ln.charCodeAt(pos);
  } else {
    return -1;
  }
};

export const MathHandler: BlockHandler<ExtendedNodeType> = {
  continue: function (parser, container) {
    const ln = parser.currentLine;
    const indent = parser.indent;
    // fenced
    const match = indent <= 3 &&
      ln.charAt(parser.nextNonspace) === container._fenceChar &&
      ln.slice(parser.nextNonspace).match(reClosingMathFence);
    // console.log(ln, parser.nextNonspace, match);
    if (match && match[0].length >= container._fenceLength) {
      // closing fence - we're at end of line, so we can return
      parser.lastLineLength =
        parser.offset + indent + match[0].length;
      parser.finalize(container, parser.lineNumber);
      return 2;
    } else {
      // skip optional spaces of fence offset
      let i = container._fenceOffset ?? 0;
      while (i > 0 && isSpaceOrTab(peek(ln, parser.offset))) {
        parser.advanceOffset(1, true);
        i--;
      }
    }
    return 0;
  },
  finalize: function (parser, block) {
    if (block._isFenced) {
      // fenced
      // first line becomes info string
      const content = block._string_content ?? '';
      const newlinePos = content.indexOf('\n');
      const firstLine = content.slice(0, newlinePos);
      const rest = content.slice(newlinePos + 1);
      block.info = common.unescapeString(firstLine.trim());
      block._literal = rest;
    } else {
      // indented
      block._literal = block._string_content?.replace(
        /(\n *)+$/,
        '\n'
      );
    }
    block._string_content = undefined; // allow GC
  },
  canContain: function () {
    return false;
  },
  acceptsLines: true
};

// inline handler

export const parseInlineMathFence: InlineHandler<ExtendedNodeType> = (parser, block) => {
  reInlineMathFenceHere.lastIndex = 0;
  reInlineMathFence.lastIndex = 0;
  const dollarSigns = parser.match(reInlineMathFenceHere);
  if (dollarSigns === undefined) {
    return false;
  }
  const starting = parser.pos;
  let matched: string | undefined;
  let contents: string;
  while ((matched = parser.match(reInlineMathFence)) !== undefined) {
    // The length should be exactly the same
    if (matched === dollarSigns) {
      const node = new Node('math_inline');
      contents = parser.subject
        .slice(starting, parser.pos - dollarSigns.length)
        .replace(/\n/gm, ' ');
      const cond = contents.length > 0 &&
        contents.match(/[^ ]/) !== null &&
        contents[0] === ' ' &&
        contents[contents.length - 1] === ' ';
      if (cond) {
        node._literal = contents.slice(1, contents.length - 1);
      } else {
        node._literal = contents;
      }
      block.appendChild(node);
      return true;
    }
  }
  // If we got here, we didn't match a closing backtick sequence.
  parser.pos = starting;
  block.appendChild(createTextnode(dollarSigns));
  return true;
};