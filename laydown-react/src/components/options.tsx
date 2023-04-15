import React from 'react';

import { HtmlRenderingOptions } from 'commonmark';
import { TemplateParams } from 'laydown';
import { LayoutSlotNode, LayoutNode } from '../nodes/LayoutNode';

import linkIcon from '../assets/icons/link.svg';
import styles from './md-styles.module.css';

type RenderedNode = React.ReactElement;

export type TemplateNodeProps = {
  params: TemplateParams,
  options: ReactRenderingOptions,
};

export type TemplateNode = (props: TemplateNodeProps) => RenderedNode;

export const DefaultTemplateNode: TemplateNode = ({ params }: TemplateNodeProps) => {
  return <>
    <span>Template Node</span>
    <br />
    <span>{JSON.stringify(params)}</span>
  </>;
};

// code

export type CodeNodeProps = {
  type: 'code' | 'math',
  lang?: string, 
  block?: boolean,
  content: string,
}

export type CodeNode = (props: CodeNodeProps) => RenderedNode;

export const DefaultCodeNode: CodeNode = (props: CodeNodeProps) => {
  const { type, lang, block, content } = props;
  if (!block)
    return <code>{ content }</code>;
  return <pre>
    <span>Code Node: { type }/{ lang?.trim() || '[]' }</span>
    <br></br>
    <code>{ content }</code>
  </pre>;
};

// anchor

export type TitleAnchorProps = {
  to: string,
  id: string,
  noClick?: boolean,
};

export type TitleAnchorRenderer = (props: TitleAnchorProps) => RenderedNode;

export const DefaultTitleAnchor = (props: TitleAnchorProps) => {
  const { to, id, noClick } = props;

  return <div className={styles['title-anchor']}>
    <div>

      <span className={styles['title-id']} id={id}></span>
      {
        !noClick &&
        <a href={to}>
          <img src={linkIcon} />
        </a>
      }
    </div>

  </div>;
};

export type ReactRenderingOptions = HtmlRenderingOptions & {
  parseLink?: (raw: string) => string;

  templateHandler?: TemplateNode;
  codeHandler?: CodeNode;
  layoutSlotHandler?: LayoutSlotNode;
  layoutHandler?: LayoutNode;
  titleAnchorHandler?: TitleAnchorRenderer;
};