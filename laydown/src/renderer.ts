import { Node, NodeWalker, NodeWalkerEvent } from 'commonmark';
import { ExtendedNodeType, ExtendedNodeDefinition } from './base/common';
import { LayoutParams, LayoutRecord, LayoutSlotParams, LayoutSlotRecord, parseLayoutParams, parseSlotParams } from './base/layout';
import { MacroStateMaintainer, parseMacro } from './base/macro';
import { HierarchicalNavNode } from './base/nav';
import { generateAnchorFromTitle, isHtmlRecordNode, mergeHtmlNodes } from './syntax/html';

type ENode = Node<ExtendedNodeType>;

const HEADER_PREFIX = 'md-';

export type RenderFunction<T> = (context: LaydownRenderingContext, node: Node<ExtendedNodeType>, children?: T[]) => T;

export interface LaydownRenderingContext {
  readonly macroStore: MacroStateMaintainer;
  readonly rootNode: HierarchicalNavNode;
  readonly nodeStack: HierarchicalNavNode[];
  readonly navHref?: string;
}

export abstract class LaydownRenderer<T> implements LaydownRenderingContext {
  macroStore!: MacroStateMaintainer;
  rootNode!: HierarchicalNavNode;
  nodeStack!: HierarchicalNavNode[];
  navHref?: string;

  resultStack!: T[][];
  layoutStack!: LayoutRecord<T>[];
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
    this.layoutStack = [];
    this.lastLine = -1;
    this.navHref = undefined;
  }

  get currentStack(): T[][] {
    if (this.layoutStack.length === 0)
      return this.resultStack;
    const layout = this.layoutStack[this.layoutStack.length - 1];
    const slots = layout.slots[layout.slots.length - 1];
    if (slots == undefined)
      return this.resultStack;
    else
      return slots.results;
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

  /**
   * 
   * @param params 
   * @param children 
   */
  abstract renderLayout(params: LayoutParams, children: T[]): T;

  /**
   * 
   * @param params 
   * @param children 
   */
  abstract renderLayoutSlot(params: LayoutSlotParams, children: T[]): T;

  enterNode(node: ENode) {
    const linePos = node.sourcepos[0][0];
    if (linePos > this.lastLine) {
      const diff = linePos - this.lastLine;
      this.macroStore.newLine();
      if (diff > 1)
        this.macroStore.newLine();
      this.lastLine = linePos;
    }
    this.currentStack.push([]);
  }

  getChildren() {
    return this.currentStack.pop();
  }

  exitNode(node: ENode, isContainer?: boolean) {
    const renderer = this.getRenderer(node.type);
    const children = isContainer ? this.getChildren() : undefined;

    // handle macro
    if (node.type === 'html_block')
      this.handleMacro(node, children ?? []);
    else if (node.type === 'heading')
      this.handleHeading(node, children ?? []);

    
    this.handleLayout(node);

    const renderResult = renderer(this, node, children);
    this.currentStack[this.currentStack.length - 1].push(renderResult);
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

      if (node.type === 'document' && !entering)
        this.endLayout();

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

  // layout related

  startLayout(params: LayoutParams) {
    const record: LayoutRecord<T> = {
      params: params,
      slots: [],
    };
    this.layoutStack.push(record);
  }

  endLayout() {
    const layout = this.layoutStack.pop();
    if (layout == undefined)
      return;
    const slots = layout.slots.map(s => this.renderLayoutSlot(s.params, s.results.pop() ?? []));
    const rendered = this.renderLayout(
      layout.params, 
      slots,
    );
    this.currentStack[this.currentStack.length - 1].push(rendered);
  }

  pushLayoutSlot(params: LayoutSlotParams) {
    const layout = this.layoutStack[this.layoutStack.length - 1];
    if (layout == undefined)
      return;
    const record: LayoutSlotRecord<T> = {
      params: params, 
      results: [[]],
    };
    layout.slots.push(record);
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

    this.navHref = href;
    return href;
  }

  handleMacro(node: ENode, children: T[]) {
    parseMacro(this.stringify(node, children))
      .forEach(([, macro]) => this.macroStore.merge(macro));
  }

  handleLayout(node: ENode) {
    const layoutStart = this.macroStore.data('layout', 'start');
    if (layoutStart !== undefined) {
      this.startLayout(parseLayoutParams(layoutStart));
    }

    const inLayout = this.layoutStack.length > 0;
    if (!inLayout)
      return;

    const layoutEnd = this.macroStore.check('layout', 'end');
    // ?? (node.type === 'document' && this.layoutStack.length > 0 ? 'doc-end' : undefined);

    const layoutHeading = !this.macroStore.check('layout', 'no-heading');
    const layoutDispFlag = this.macroStore.peek('layout', 'disp');
    const layoutDisp = this.macroStore.data('layout', 'disp')
      ?? (((layoutHeading && node.type === 'heading') || layoutDispFlag) ? '' : undefined );


    if (layoutDisp !== undefined) {
      this.pushLayoutSlot(parseSlotParams(layoutDisp));
    }
    if (layoutEnd !== undefined) {
      this.endLayout();
    }
  }

}

export default LaydownRenderer;