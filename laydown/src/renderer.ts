import { Node, NodeWalker, NodeWalkerEvent } from 'commonmark';
import { ExtendedNodeType, ExtendedNodeDefinition } from './base/common';
import { MacroStateMaintainer, parseMacro } from './base/macro';
import { HierarchicalNavNode } from './base/nav';
import { generateAnchorFromTitle, isHtmlRecordNode, mergeHtmlNodes } from './syntax/html';

type ENode = Node<ExtendedNodeType>;

const HEADER_PREFIX = 'md-';

export type RenderFunction<T> = (context: LayDownRenderingContext, node: Node<ExtendedNodeType>, children?: T[]) => T;

export interface LayDownRenderingContext {
  readonly macroStore: MacroStateMaintainer;
  readonly rootNode: HierarchicalNavNode;
  readonly nodeStack: HierarchicalNavNode[];
}

export abstract class LayDownRenderer<T> implements LayDownRenderingContext {
  macroStore!: MacroStateMaintainer;
  rootNode!: HierarchicalNavNode;
  nodeStack!: HierarchicalNavNode[];
  resultStack!: T[][];
  lastLine!: number;

  constructor() {
    this.init();
  }

  init() {
    this.macroStore = new MacroStateMaintainer();
    this.rootNode = {
      name: '',
      hierarchy: 0
    };
    this.nodeStack = [];
    this.nodeStack.push(this.rootNode);

    this.resultStack = [[]];
    this.lastLine = -1;
  }

  /**
   * 
   * @param type 
   */
  abstract getRenderer(type: ExtendedNodeType): RenderFunction<T>;

  /**
   * used in handle heading & macro
   * @param node 
   * @param children 
   */
  abstract stringify(node: ENode, children: T[]): string;

  enterNode(node: ENode) {
    const linePos = node.sourcepos[0][0];
    if (linePos > this.lastLine) {
      const diff = linePos - this.lastLine;
      this.macroStore.newLine();
      if (diff > 1)
        this.macroStore.newLine();
      this.lastLine = linePos;
    }
    this.resultStack.push([]);
  }

  getChildren() {
    return this.resultStack.pop();
  }

  exitNode(node: ENode, isContainer?: boolean) {
    const renderer = this.getRenderer(node.type);
    const children = isContainer ? this.getChildren() : undefined;
    const renderResult = renderer(this, node, children);
    this.resultStack[this.resultStack.length - 1].push(renderResult);
  }

  walk(ast: ENode) {
    const walker = new NodeWalker(ast, ExtendedNodeDefinition);
    let event: NodeWalkerEvent<ExtendedNodeType> | undefined = undefined;

    // post processing
    while ((event = walker.next())) {
      const { node } = event;
      if (isHtmlRecordNode(node)) {
        const reducedNode = mergeHtmlNodes(node, 'html_paragraph', 'html_paragraph_text');
        walker.resumeAt(reducedNode, true);
      }
    }

    // render
    this.init();
    walker.resumeAt(ast, true);

    while ((event = walker.next())) {
      const { node, entering } = event;

      if (ExtendedNodeDefinition.isContainer(node)) {
        if (entering) {
          this.enterNode(node);
        }
        else {
          this.exitNode(node, true);
        }
      } else {
        this.exitNode(node, false);
      }
    }
  }

  result() {
    return {
      nav: this.rootNode as HierarchicalNavNode | undefined, 
      render: this.resultStack[this.resultStack.length - 1] as T[] | undefined,
    };
  }

  // special handlers

  handleHeading(node: ENode, children: T[]) {
    const HeadingTag = `h${node.level}`;

    const headingString = this.stringify(node, children);
    const headingHash =
      this.macroStore.data(HeadingTag, 'use-hash') ??
      this.macroStore.data('heading', 'use-hash') ??
      generateAnchorFromTitle(headingString);

    const href = '#' + HEADER_PREFIX + headingHash;

    // process node level
    let currentNode = this.nodeStack[this.nodeStack.length - 1];
    while (currentNode.hierarchy >= (node.level ?? 1)) {
      this.nodeStack.pop();
      currentNode = this.nodeStack[this.nodeStack.length - 1];
    }
    const thisNode = {
      name: headingString.replace(/\n\r/g, ' ').trim(),
      hierarchy: node.level ?? 1,
      href: href,
    };
    (currentNode.children = currentNode.children ?? [])
      .push(thisNode);
    this.nodeStack.push(thisNode);
  }

  handleMacro(node: ENode, children: T[]) {
    parseMacro(this.stringify(node, children))
      .forEach(([, macro]) => this.macroStore.merge(macro));
  }

}

export default LayDownRenderer;