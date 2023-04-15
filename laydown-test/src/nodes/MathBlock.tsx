import { MathComponent } from 'mathjax-react';
import React, { PropsWithChildren } from 'react';

export const filterStringChildren = (children: React.ReactNode | React.ReactNode[]) => {
  return React.Children.toArray(children)
    .filter(x => typeof x === 'string')
    .join('');
};

export const MathSpan = (props: PropsWithChildren<object>) => {
  const tex = filterStringChildren(props.children);
  return <MathComponent tex={tex} display={false} />;
};

export const MathBlock = (props: PropsWithChildren<object>) => {
  const tex = filterStringChildren(props.children);
  return <MathComponent tex={tex} display={true} />;
};

export default MathBlock;