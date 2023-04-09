import { Node, createTextnode, InlineHandler } from 'commonmark';
import { ExtendedNodeType } from '../base/common';
import search from '@jukben/emoji-search';


const reInlineEmoji = /^:\S+?:/g;

export const parseInlineEmoji: InlineHandler<ExtendedNodeType> = (parser, block) => {
  reInlineEmoji.lastIndex = 0;
  const matched = parser.match(reInlineEmoji);
  if (matched) {
    const stripped = matched.substring(1, matched.length - 1);
    const emoji = search(stripped.replace(/-/g, '_'))[0]?.char;
    if (emoji === undefined){
      const newChild = new Node<ExtendedNodeType>('emoji', block.sourcepos);
      newChild.literal = stripped;
      block.appendChild(newChild);
    } else
      block.appendChild(createTextnode(emoji ?? matched));
    return true;
  }
  return false;
};