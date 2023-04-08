import { MathComponent } from 'mathjax-react';
import React, { PropsWithChildren } from 'react';
import { filterStringChildren } from '../base/common';

export const MathSpan = (props: PropsWithChildren<object>) => {
  const tex = filterStringChildren(props.children);
  return <MathComponent tex={tex} display={false} />;
};

export const MathBlock = (props: PropsWithChildren<object>) => {
  const tex = filterStringChildren(props.children);
  return <MathComponent tex={tex} />;
};

export default MathBlock;