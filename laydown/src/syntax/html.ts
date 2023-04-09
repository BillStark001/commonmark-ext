import { Node, NodeType, common } from 'commonmark';
import md5 from 'js-md5';

export const isHtmlRecordNode = <T extends NodeType>(n?: Node<T>) => {
  if (n === undefined)
    return false;
  reHtmlTag2.lastIndex = 0;
  if (n.type === 'html_block' || n.type === 'html_inline')
    return reHtmlTag2.test(n.literal ?? '');
  return false;
};

const reHtmlTag = new RegExp('(?:' + common.HTML_OPEN_TAG + '|' + common.HTML_CLOSE_TAG + ')', 'g');
const reHtmlTag2 = new RegExp(reHtmlTag);
const reTagContent = /^<(\/?)([A-Za-z][A-Za-z0-9-]*)/;

export type HtmlParagraphDefinition = {
  startTag?: string;
  endTag?: string;
  tagName?: string;
};

export type TemporaryHtmlRecord<T extends NodeType> = HtmlParagraphDefinition & {
  tagName: string;
  position: Node<T>['sourcepos']
  sub: ({
    type: 'node';
    value: Node<T>;
  } | {
    type: 'text';
    position: Node<T>['sourcepos']
    value: string;
  } | {
    type: 'html';
    value: TemporaryHtmlRecord<T>;
  })[]
};

export const rationalizeParagraphRecord = <T extends NodeType>(record: TemporaryHtmlRecord<T>, htmlParagraphType: T, htmlParagraphTextType: T): Node<T> => {
  const retNode = new Node<T>(htmlParagraphType, record.position);
  for (const _sub of record.sub) {
    const { type, value } = _sub;
    if (type === 'html') {
      retNode.appendChild(rationalizeParagraphRecord(value, htmlParagraphType, htmlParagraphTextType));
    } else if (type === 'node') {
      value.unlink();
      retNode.appendChild(value);
    } else {
      const node = new Node(htmlParagraphTextType, _sub.position);
      node.literal = value;
      retNode.appendChild(node);
    }
  }
  const definition: HtmlParagraphDefinition = {
    startTag: record.startTag, 
    endTag: record.endTag,
    tagName: record.tagName,
  };
  retNode.customData = definition;
  return retNode;
};

export const mergeHtmlNodes = <T extends NodeType>(startNode: Node<T>, htmlParagraphType: T, htmlParagraphTextType: T) => {
  if (startNode.parent === undefined || !isHtmlRecordNode(startNode))
    throw 'start node must have a parent & it must be an html node';
  const markerNode = startNode.prev;
  const parentNode = startNode.parent;

  // initialize necessary vars
  let currentNode: Node<T> | undefined = startNode;
  let currentIsHtml = isHtmlRecordNode(currentNode);
  reHtmlTag.lastIndex = 0;
  let lastMatchIndex = 0;
  const rootRecord: TemporaryHtmlRecord<T> = {
    position: [[-1, -1], [-1, -1]],
    tagName: '',
    sub: [],
  };
  const stack = [rootRecord];


  while (currentNode !== undefined && stack.length > 0) {
    const currentRecord = stack[stack.length - 1];

    if (currentIsHtml) {
      const match = reHtmlTag.exec(currentNode.literal ?? '');
      if (match === null) { // reached the end of node
        // only push spare item
        const item = currentNode.literal?.slice(lastMatchIndex);
        if (item !== undefined && item !== '')
          currentRecord.sub.push({ type: 'text', position: currentNode.sourcepos, value: item });

        // proceed to the next node
        reHtmlTag.lastIndex = 0;
        lastMatchIndex = 0;
        const _n = currentNode;
        currentNode = currentNode.next;
        currentIsHtml = isHtmlRecordNode(currentNode);
        _n.unlink();
      } else { // not reached the end yet
        // push spare item
        const item = currentNode.literal?.slice(lastMatchIndex, match.index);
        if (item !== undefined && item !== '')
          currentRecord.sub.push({ type: 'text', position: currentNode.sourcepos, value: item });

        // handle html tag
        const tag = match[0];
        const [, slash, name] = reTagContent.exec(tag) ?? [];
        const isCloseTag = slash === '/';
        const isVoidTag = name === 'br' || name === 'img' || name === 'input';

        if (!isCloseTag) { 
          // we have another layer of html tag
          const newRecord: TemporaryHtmlRecord<T> = {
            position: currentNode.sourcepos,
            tagName: name ?? '', 
            sub: [], 
            startTag: tag,
          };
          currentRecord.sub.push({ type: 'html', value: newRecord });
          if (!isVoidTag)
            stack.push(newRecord);
        } else {
          // end the current layer
          let currentRecord2: TemporaryHtmlRecord<T> | undefined = currentRecord;
          let recordAdded = false;
          const stackBackup = [...stack];
          while (currentRecord2 !== undefined) { 
            stack.pop();
            if (currentRecord2.tagName === name) {
              currentRecord2.endTag = tag;
              recordAdded = true;
              break;
            }
            currentRecord2 = stack[stack.length - 1];
          }
          if (!recordAdded) {
            currentRecord.sub.push({ type: 'text', position: currentNode.sourcepos, value: tag });
            stackBackup.forEach(x => stack.push(x));
          }
        }

        // update index
        lastMatchIndex = match.index + tag.length;
      }
    } else { // proceed
      currentRecord.sub.push({ type: 'node', value: currentNode });
      reHtmlTag.lastIndex = 0;
      lastMatchIndex = 0;
      const _n = currentNode;
      currentNode = currentNode.next;
      currentIsHtml = isHtmlRecordNode(currentNode);
      _n.unlink();
    }
  }

  const htmlParagraph = (rootRecord.sub.length === 1 && rootRecord.sub[0].type === 'html') ? 
    rationalizeParagraphRecord(rootRecord.sub[0].value, htmlParagraphType, htmlParagraphTextType) :
    rationalizeParagraphRecord(rootRecord, htmlParagraphType, htmlParagraphTextType);
  // htmlParagraph.customData = rootRecord.sub;

  if (markerNode === undefined)
    parentNode.appendChild(htmlParagraph);
  else
    markerNode.insertAfter(htmlParagraph);

  return htmlParagraph;
};

export const generateAnchorFromTitle = (title: string) => {
  const anchorText = title
    
    .replace(// eslint-disable-next-line no-control-regex
      /[%/\\,.#?;:$+@&={}[\]()<>\x00-\x1f\x7f-\xff]/g, ''
      /*(str) => str.charCodeAt(0).toString(16)*/)
    .replace(/[\s_]+/g, '_')
    .replace(/[\x80-\uffff]+/g, (str) => md5(str).slice(8, 12))
    ;
  return anchorText;
};