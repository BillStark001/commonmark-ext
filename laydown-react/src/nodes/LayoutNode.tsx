import React, { PropsWithChildren } from 'react';

import { LayoutParams, LayoutSlotParams } from 'laydown';


export const ReactLayoutSlot = (props: PropsWithChildren<LayoutSlotParams>) => {
  const { children } = props;
  return <div>
    { children }
  </div>;
};

export const ReactLayout = (props: PropsWithChildren<LayoutParams>) => {
  return <div style={{
    display: 'flex',
    flexDirection: props.direction === 'vertical' ? 'column' : 'row'
  }}>
    { props.children }
  </div>;
};