import React from 'react';

import { BlockParser, NodeTypeDefinition } from 'commonmark';
import path from 'path-browserify';
import { useEffect, useState } from 'react';
import { ExtendedNodeType, ExtendedSyntaxOptions } from 'laydown';

import { compileTemplate, TemplateParams } from 'laydown';
import { ReactRenderingOptions, render } from '../components/node-renderer';

import { useResourceStore } from './ResourceNode';
import { delay } from '../base/common';


export type MarkdownTemplateProps = {
  root?: string,
  template: TemplateParams,
  options?: ReactRenderingOptions,
  definition?: NodeTypeDefinition<ExtendedNodeType>,
};

const MarkdownTemplate = (props: MarkdownTemplateProps) => {

  const { name, args, kwargs } = props.template;
  const root = props.root || '/';

  const [link, setLink] = useState<string>(path.join(root, name));
  useEffect(() => {
    setLink(path.join(root, name));
  }, [name]);

  const [resource, , meta] = useResourceStore({
    link: link, 
    descriptor: 't.md',
  });

  const [rnd, setRnd] = useState<JSX.Element | undefined>();

  useEffect(() => {
    const template = resource !== undefined ? 
      compileTemplate(resource, args, kwargs) : 
      '';

    if (meta?.format === 'md') {
      const parser = new BlockParser(ExtendedSyntaxOptions);
      const ast = parser.parse(template);
      setRnd(
        ast !== undefined ?
          render(ast, props.options, props.definition) :
          undefined
      );
    } else {
      setRnd(<>{ template }</>);
    }
  }, [resource, meta, args, kwargs]);

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

export default MarkdownTemplate;