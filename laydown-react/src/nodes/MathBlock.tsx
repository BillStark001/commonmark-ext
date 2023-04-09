import { MathJax } from 'better-react-mathjax';
import React, { PropsWithChildren } from 'react';

export const MathSpan = (props: PropsWithChildren<object>) => {
  return <MathJax inline>{ props.children }</MathJax>;
};

export const MathBlock = (props: PropsWithChildren<object>) => {
  return <MathJax>{ props.children }</MathJax>;
};

export default MathBlock;