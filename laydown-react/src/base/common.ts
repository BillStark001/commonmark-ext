import React from 'react';

export const deepFreeze = <T extends object = object>(obj: T) => {
  const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;
  propNames.forEach((name) => {
    const prop = obj[name];
    if (typeof prop == 'object' && prop !== null)
      deepFreeze(prop);
  });
  return Object.freeze(obj);
};

export function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const filterStringChildren = (children: React.ReactNode | React.ReactNode[]) => {
  return React.Children.toArray(children)
    .filter(x => typeof x === 'string')
    .join('');
};

export const deepFilterStringChildren = (node: JSX.Element): string => {
  if (typeof node !== 'object') {
    return node == undefined ? '' : String(node);
  }
  if (!node.props?.children) {
    return '';
  }
  if (Array.isArray(node.props?.children)) {
    return node.props.children.map((child: JSX.Element) => deepFilterStringChildren(child)).join('');
  }
  return deepFilterStringChildren(node.props?.children);
};