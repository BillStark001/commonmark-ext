import React, { PropsWithChildren } from 'react';
import { useResourceStore } from '../nodes/ResourceNode';


const reUnsafeProtocol = /^javascript:|vbscript:|file:|data:/i;
const reSafeDataProtocol = /^data:image\/(?:png|gif|jpeg|webp)/i;

export const potentiallyUnsafe = (url?: string | null) => {
  if (!url)
    return true;
  return reUnsafeProtocol.test(url) && !reSafeDataProtocol.test(url);
};


const SourceElementSet: ReadonlySet<keyof JSX.IntrinsicElements> = new Set(['img', 'audio', 'video', 'source']) as ReadonlySet<keyof JSX.IntrinsicElements>;
const HrefElementSet: ReadonlySet<keyof JSX.IntrinsicElements> = new Set(['a', 'link']) as ReadonlySet<keyof JSX.IntrinsicElements>;
const VoidElementSet: ReadonlySet<keyof JSX.IntrinsicElements> = new Set(['input', 'img', 'br']) as ReadonlySet<keyof JSX.IntrinsicElements>;


export const handleHtmlElementLink = (elem: JSX.Element, parser?: (s: string) => string) => {
  if (parser === undefined)
    return elem;
  if (
    elem.type === 'img' ||
    elem.type === 'audio' ||
    elem.type === 'video' ||
    elem.type === 'source'
  ) {
    return <elem.type {...{
      ...elem.props,
      src: parser(elem.props.src) ?? ''
    }} />;
  } else if (
    elem.type === 'a' ||
    elem.type === 'link'
  ) {
    const props = { ...elem.props };
    delete props.isActive;
    return <elem.type {...props} />;
  }
  return elem;
};


export const isVoidElement = (element: JSX.Element) => {
  const elementType = element.type;
  return VoidElementSet.has(elementType);
};


export const replaceChildren = (elem: JSX.Element, children: React.ReactNode | React.ReactNode[]) => {
  if (elem === undefined || isVoidElement(elem))
    return elem;
  const props = { ...elem.props };
  delete props.children;
  return <elem.type {...props} >
    {children}
  </elem.type>;
};


const HtmlNodeWithResource = (props: PropsWithChildren<{
  type: keyof JSX.IntrinsicElements,
  link: string,
  descriptor?: string,
  props: Record<string, unknown>
}>) => {
  const { type: TagType, link, descriptor, props: elemProps, children } = props;

  const [data] = useResourceStore({
    link: link,
    descriptor: descriptor,
  });

  const filteredProps = {
    ...elemProps,
    children: children ?? elemProps.children as React.ReactNode,
    src: data// !== undefined ? data : link,
  };

  if (VoidElementSet.has(TagType))
    delete filteredProps.children;

  return <TagType {...filteredProps} />;
};

type E = JSX.Element | JSX.Element[] | string;

export const filterHtmlNode = (elem: E): E => {
  if (typeof elem === 'string')
    return elem;
  else if (elem instanceof Array)
    return elem.map(x => deepFilterHtmlNode(x)) as E;
  const elemType = elem.type as keyof JSX.IntrinsicElements;
  const elemProps = elem.props as Record<string, unknown>;
  if (SourceElementSet.has(elemType)) {
    return <HtmlNodeWithResource
      type={elemType}
      link={elemProps.src as string ?? ''}
      props={elemProps}
    />;
  } else if (HrefElementSet.has(elemType)) {
    const _p: Record<string, unknown> = { ...elemProps, isactive: elemProps.isactive ?? elemProps.isActive };
    delete _p.isActive;
    const ElemType = elemType;
    return <ElemType {..._p} />;
  } else {
    return elem;
  }
};

export const deepFilterHtmlNode = (elem: E): E => {
  if (typeof elem === 'string')
    return elem;
  else if (elem instanceof Array)
    return elem.map(x => deepFilterHtmlNode(x)) as E;
  const children = elem.props.children;
  if (children === undefined || (children instanceof Array && children.length === 0))
    return filterHtmlNode(elem);
  const newChildren = React.Children.map(children, (c, i) =>
    (<React.Fragment key={`heml_node_${i}`}>{deepFilterHtmlNode(c)}</React.Fragment>)
  );
  const newProps = { ...elem.props, children: newChildren };
  return filterHtmlNode(<elem.type {...newProps} />);
};
