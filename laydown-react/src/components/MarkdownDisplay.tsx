import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ExtendedNodeDefinition, ExtendedSyntaxOptions } from 'laydown';
import { filterStringChildren } from '../base/common';
import { ReactRenderingOptions, render } from './node-renderer';
import { BlockParser, common } from 'commonmark';
import { delay } from '../base/common';

export type MarkdownDisplayProps = {
  content?: string;
};

const reWithSuffix = /\.[\w]{1,8}$/;

const options: ReactRenderingOptions = {
  esc: common.escapeXml,
  parseLink: (raw) => {
    const suffix = reWithSuffix.test(raw) ? '' : '.md';
    // TODO temporary solution
    return '/md' + raw + suffix;
  }
};


export const MarkdownDisplay = (props: PropsWithChildren<MarkdownDisplayProps>) => {
  const [md, setMd] = useState<string>('*NO MARKDOWN FILE*');
  // const [ast, setAst] = useState<Node<ExtendedNodeType> | undefined>();
  const [rnd, setRnd] = useState<JSX.Element | undefined>();

  useEffect(() => {
    setMd(filterStringChildren(props.children));
  }, [props.children]);

  useEffect(() => {
    const parser = new BlockParser(ExtendedSyntaxOptions);
    const ast = parser.parse(md);
    setRnd(
      ast !== undefined ?
        render(ast, options, ExtendedNodeDefinition) :
        undefined
    );
  }, [md]);

  useEffect(() => {
    delay(10).then(() => {
      const element = document.querySelector(location.hash || '#null');
      element?.scrollIntoView({ block: 'start' });
    }).catch(console.error);
  }, [rnd]);


  return <>
    {rnd}
  </>;
};

export default MarkdownDisplay;