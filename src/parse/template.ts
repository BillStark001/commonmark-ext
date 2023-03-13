/* eslint-disable no-useless-escape */
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

const reTemplateReplacement = new RegExp(
  '\\{{3}\\s*(' + 
  NAME_RAW + 
  ')\\s*(?:\\s*\\?\\?\\s*([^\\s\\}]*))?\\s*\\}{3}', 
  'g'
);

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

const tryMatchCurrentContext2 = (context: string): [TemplateTokenType, string] | undefined => {
  let matched: RegExpExecArray | null;
  for (const key of reTemplateHierarchy) {
    matched = reTemplateSyntax[key].exec(context);
    if (matched)
      return [key, matched[0]];
  }
  return undefined;
};

const tryParseCurrentContext = (type: TemplateTokenType, raw: string): TemplateParamsType => {
  let lastValue: TemplateParamsType = undefined;
  if (type === 'num') {
    lastValue = Number(raw);
  }
  else if (type === 'str1' || type === 'str2') {
    lastValue = parseStringLiteral(raw, type === 'str1');
  }
  else if (type === 'key') {
    lastValue = raw === 'undefined' ? undefined : JSON.parse(raw);
  }
  else if (type === 'name') {
    lastValue = raw;
  }
  return lastValue;
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
      // do nothing
      // else if (key === 'space') {
      // }
      else if (key === 'assign') {
        if (typeof lastValue === 'string') {
          lastName = lastValue;
        } else {
          lastName = `key_${lastValue}`;
        }
        lastValue = undefined;
      }
      // value
      else {
        lastValue = tryParseCurrentContext(key, value);
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

export const compileTemplate = (
  template: string,
  args?: TemplateParamsType[], 
  kwargs?: Record<string, TemplateParamsType>
) => {
  reTemplateReplacement.lastIndex = 0;
  let ans = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = reTemplateReplacement.exec(template))) {
    // console.log(match[0]);
    const [total, key, def] = match;
    const index = key[0] === '$' ? Number(key.substring(1)) : NaN;

    const [a, b] = tryMatchCurrentContext2(def ?? '') ?? ['end', ''];
    const defVal = tryParseCurrentContext(a, b);
    
    const val = kwargs?.[key] ?? (!isNaN(index) ? args?.[index] : undefined);

    ans += template.substring(lastIndex, match.index);
    ans += String(val ?? defVal);
    lastIndex = match.index + total.length;
  }

  ans += template.substring(lastIndex);
  return ans;

};
