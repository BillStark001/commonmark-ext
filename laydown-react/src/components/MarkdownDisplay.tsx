import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { ExtendedSyntaxOptions } from 'laydown';
import { filterStringChildren } from '../base/common';
import LaydownReactRenderer, { ReactRenderingOptions } from './node-renderer';
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

  const md = filterStringChildren(props.children) ?? '*NO MARKDOWN FILE*';

  const ast = useMemo(() => {
    const parser = new BlockParser(ExtendedSyntaxOptions);
    return parser.parse(md);
  }, [md]);

  const { render } = useMemo(() => {
    const renderer = new LaydownReactRenderer(options);
    renderer.walk(ast);
    return renderer.result();
  }, [ast]);

  useEffect(() => {
    delay(10).then(() => {
      const element = document.querySelector(location.hash || '#null');
      element?.scrollIntoView({ block: 'start' });
    }).catch(console.error);
  }, [render]);


  return <>
    {render}
  </>;
};

export default MarkdownDisplay;