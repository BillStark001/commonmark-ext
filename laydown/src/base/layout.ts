export type LayoutParams = {
  /**
   * default: inline
   */
  direction?: 'horizontal' | 'vertical' | 'inline';
  /**
   * default: infinite
   */
  slots?: number | 'infinite';
  /**
   * default: the sum of all slots' weights
   */
  totalWeight?: number;
};

export type LayoutSlotParams = {
  /**
   * default: auto
   */
  weight?: number | 'max-content' | 'min-content' | 'auto';
};

export type LayoutRecord<T> = {
  params: LayoutParams;
  slots: LayoutSlotRecord<T>[];
}

export type LayoutSlotRecord<T> = {
  params: LayoutSlotParams;
  results: T[][];
}


const reLayoutParams = /(?:([hvia])([0-9]*))?(w[0-9]*\.?[0-9]*)?/;

export const parseLayoutParams = (params: string): LayoutParams => {
  reLayoutParams.lastIndex = 0;
  const res = reLayoutParams.exec(params);
  if (res == null)
    return {};
  const dirFlag = res[1];
  const slFlag = res[2];
  const wFlag = res[3]?.substring(1);

  return {
    direction: dirFlag.startsWith('h') ? 'horizontal' : (
      dirFlag.startsWith('v') ? 'vertical' : (
        dirFlag.startsWith('i') ? 'inline' : undefined
      )
    ),
    slots: slFlag == undefined || slFlag.length === 0 || isNaN(Number(slFlag)) ?
      undefined :
      Number(slFlag),
    totalWeight: wFlag == undefined || wFlag.length === 0 || isNaN(Number(wFlag)) ?
      undefined :
      Number(wFlag),
  };
};

export const parseSlotParams = (params: string): LayoutSlotParams => {
  params = params.trim().replace(/_-/g, '').toLowerCase();
  if (params === 'maxcontent')
    return { weight: 'max-content' };
  else if (params === 'mincontent')
    return { weight: 'min-content' };
  else if (params === 'auto')
    return { weight: 'auto' };
  const s = params.replace(/^w/, '').trim();
  const n = s.length === 0 ? NaN : Number(s);
  return {
    weight: isNaN(n) ? undefined : n
  };
};