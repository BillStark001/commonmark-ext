import React, { PropsWithChildren } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';

import styles from './md-nodes.module.css';

export const filterStringChildren = (children: React.ReactNode | React.ReactNode[]) => {
  return React.Children.toArray(children)
    .filter(x => typeof x === 'string')
    .join('');
};

export type CodeSpanProps = {
  lang?: string;
};

export type CodeBlockProps = CodeSpanProps & {
  editable?: boolean;
};

export const CodeSpan = (props: PropsWithChildren<CodeSpanProps>) => {
  const code = filterStringChildren(props.children);
  return <code className={styles['code-span']}>
    { code }
  </code>;
};

export const CodeBlock = (props: PropsWithChildren<CodeBlockProps>) => {
  const code = filterStringChildren(props.children);
  return <div className={styles['code-block']}>
    <SyntaxHighlighter language={props.lang} >
      { code }
    </SyntaxHighlighter>
  </div>;
};