import { Node, InlineHandler, InlineParser } from 'commonmark';
import { ExtendedNodeType } from './common';


const CHAR_RAW = 'a-zA-Z_$\\-'
  + '\\u0100-\\u02af\\u0370-\\u1fff\\u20a0-\\u20cf\\u2c00-\\u2dff'
  + '\\u3040-\\u318f\\u31f0-\\ud7ff'
  + '\\uf900-\\ufaff';
const NAME_RAW = `[${CHAR_RAW}][0-9${CHAR_RAW}]*`;

const reTemplateName = new RegExp('^@\[' + NAME_RAW + '\]');
const reTemplateParamStart = /^\(/;
const reTemplateParamEnd = /^\)/;

const reTemplateSyntax = Object.freeze({
  num: /^(?:[\-\+]?[0-9]*\.[0-9]+|\-?[0-9]+\.?[0-9]*)(?:[Ee][+-]?[0-9]+)?/,
  str2: /^"(?:\\.|[^"\\])*"/,
  str1: /^'(?:\\.|[^'\\])*'/,
  key: /^(?:true|false|null|undefined)/,
  name: new RegExp('^' + NAME_RAW + ''),

  space: /^\s+/,
  assign: /^[\=\:：＝]+/,
  sep: /^[\,\;，；]+/,

  end: reTemplateParamEnd,
});
type TemplateTokenType = keyof typeof reTemplateSyntax;
const reTemplateHierarchy: TemplateTokenType[] = [
  'num', 'str2', 'str1', 'key', 'end', 'name', 'assign', 'sep', 'space'
];

const parseStringLiteral = (str: string, singleQuote?: boolean): string => {
  if (singleQuote) {
    str = str.replace(/(?<!\\)(?:\\\\)*(")/g, '\\"');
    str = '"' + str.slice(1, str.length - 1) + '"';
  }
  return JSON.parse(
    str.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  );
};


export type TemplateParamsType = string | number | boolean | null | undefined;
export type TemplateParams = {
  name: string,
  args: TemplateParamsType[],
  kwargs: { [key: string]: TemplateParamsType }
};

const tryMatchCurrentContext = (parser: InlineParser<ExtendedNodeType>): [TemplateTokenType, string] | undefined => {
  let matched: string | undefined;
  for (const key of reTemplateHierarchy) {
    matched = parser.match(reTemplateSyntax[key]);
    if (matched !== undefined)
      return [key, matched];
  }
  return undefined;
};

export const parseInlineTemplate: InlineHandler<ExtendedNodeType> = (parser, block) => {
  const nameMatch = parser.match(reTemplateName);
  if (nameMatch === undefined)
    return false;
  const templateName = nameMatch.substring(2, nameMatch.length - 1);
  const templateParams: TemplateParams = {
    name: templateName,
    args: [],
    kwargs: {},
  };
  const startPos = parser.pos;
  let paramsParsingSuccessful = false;

  let lastName: string | undefined = undefined;
  let lastValue: TemplateParamsType | undefined = undefined;

  const pushNameAndValue = () => {
    if (lastValue !== undefined) {
      if (lastName !== undefined)
        templateParams.kwargs[lastName] = lastValue;
      else
        templateParams.args.push(lastValue);
    } else if (lastName !== undefined) {
      templateParams.kwargs[lastName] = undefined;
    }
  };

  if (parser.match(reTemplateParamStart) !== undefined) {
    let matched: [TemplateTokenType, string] | undefined;
    while ((matched = tryMatchCurrentContext(parser))) {
      const [key, value] = matched;
      // end
      if (key === 'end') {
        paramsParsingSuccessful = true;
        break;
      }
      // control
      else if (key === 'sep') {
        pushNameAndValue();
      }
      else if (key === 'space') {
      }
      else if (key === 'assign') {
        if (typeof lastValue === 'string') {
          lastName = lastValue;
        } else {
          lastName = `key_${lastValue}`;
        }
        lastValue = undefined;
      }
      // value
      else if (key === 'num') {
        lastValue = Number(value);
      }
      else if (key === 'str1' || key === 'str2') {
        lastValue = parseStringLiteral(value, key === 'str1');
      }
      else if (key === 'key') {
        lastValue = value === 'undefined' ? undefined : JSON.parse(value);
      }
      else if (key === 'name') {
        lastValue = value;
      }
    }
  }
  if (!paramsParsingSuccessful) {
    templateParams.args = [];
    templateParams.kwargs = {};
    parser.pos = startPos;
  }
  pushNameAndValue();
  const node = new Node<ExtendedNodeType>('template');
  node.customData = templateParams;
  block.appendChild(node);
  return true;
};