import React, { PropsWithChildren } from 'react';

import { LayoutParams, LayoutSlotParams } from 'laydown';

type RenderedNode = React.ReactElement;

export type LayoutSlotNode = (props: PropsWithChildren<LayoutSlotParams>) => RenderedNode;

export type LayoutNode = (props: PropsWithChildren<LayoutParams>) => RenderedNode;

export const DefaultLayoutSlotNode = (props: PropsWithChildren<LayoutSlotParams>) => {
  const { children } = props;
  return <div>
    { children }
  </div>;
};

export const DefaultLayoutNode = (props: PropsWithChildren<LayoutParams>) => {
  return <div style={{
    display: 'flex',
    flexDirection: props.direction === 'vertical' ? 'column' : 'row'
  }}>
    { props.children }
  </div>;
};