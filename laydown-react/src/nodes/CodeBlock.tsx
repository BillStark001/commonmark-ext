import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { filterStringChildren } from '../base/common';
import SyntaxHighlighter from 'react-syntax-highlighter';

const _codeSpan = styled.code`
  padding: 3px 5px;
  margin: 1px;
  border-radius: 4px;
  background-color: var(--color-bg2);
`;

const _codeBlock = styled.div`
  
`;

export type CodeSpanProps = {
  lang?: string;
};

export type CodeBlockProps = CodeSpanProps & {
  editable?: boolean;
};

export const CodeSpan = (props: PropsWithChildren<CodeSpanProps>) => {
  const code = filterStringChildren(props.children);
  return <_codeSpan>
    { code }
  </_codeSpan>;
};

export const CodeBlock = (props: PropsWithChildren<CodeBlockProps>) => {
  const code = filterStringChildren(props.children);
  return <_codeBlock>
    <SyntaxHighlighter language={props.lang} >
      { code }
    </SyntaxHighlighter>
  </_codeBlock>;
};