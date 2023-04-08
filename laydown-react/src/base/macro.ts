

const reHtmlComment = /<!--([\s\S]*?)-->/g;
const reMacroFormat = /(?:([\w-]+)\s*:\s*)?([\w-]+)(?:\$(set|restore|one[-_]time|next[-_]line))?(?:#([\w-]+))?/g;

export const parseMacro = (str: string) => {
  const ans: [number, MacroRecord][] = [];
  reHtmlComment.lastIndex = 0;
  reMacroFormat.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = reHtmlComment.exec(str))) {
    const rawMacro = match[1];
    let matchInner: RegExpExecArray | null;
    const kwMacro: MacroRecord = {};
    while ((matchInner = reMacroFormat.exec(rawMacro))) {
      const key = matchInner[1] ?? '';
      const val = matchInner[2];
      const opr = (matchInner[3]?.replace(/_/g, '-')) as MacroSuffix ?? 'one-time';
      const dat = matchInner[4];
      (kwMacro[key] = kwMacro[key] ?? []).push([val, opr, dat]);
    }
    ans.push([match.index, kwMacro]);
  }
  return ans;
};

export type MacroSuffix = 'set' | 'restore' | 'one-time' | 'next-line';

export type MacroRecord = Record<string, [string, MacroSuffix, string | undefined][]>;

export type MacroRecordSingle = {
  opr: MacroSuffix | 'next-line-2'
  dat: string | undefined
};

export class MacroStateMaintainer{

  readonly record: Map<string, Map<
    string, MacroRecordSingle
  >>;

  constructor() {
    this.record = new Map();
  }

  merge(record: MacroRecord) {
    for (const key in record) {
      if (!this.record.has(key))
        this.record.set(key, new Map());
      const states = this.record.get(key) as Map<string, MacroRecordSingle>;
      for (const [val, opr, dat] of record[key]) {
        if (opr === 'restore')
          states.delete(val);
        else if (opr === 'next-line' && states.get(val)?.opr !== 'set')
          states.set(val, { opr: 'next-line-2', dat: dat });
        else if (opr === 'set')
          states.set(val, { opr: 'set', dat: dat });
        else if (opr === 'one-time' && states.get(val)?.opr !== 'set')
          states.set(val, { opr: 'one-time', dat: dat });
      }
    }
  }

  peek(key: string, value: string): MacroSuffix | undefined {
    const ret = this.record.get(key)?.get(value);
    if (ret?.opr === 'next-line-2')
      return undefined;
    return ret?.opr;
  }

  data(key: string, value: string): string | undefined {
    const ret = this.record.get(key)?.get(value);
    if (ret?.opr === 'one-time')
      this.record.get(key)?.delete(value);
    return ret?.dat;
  }

  check(key: string, value: string): MacroSuffix | undefined {
    const ret = this.peek(key, value);
    if (ret === 'one-time')
      this.record.get(key)?.delete(value);
    return ret;
  }

  newLine() {
    this.record.forEach((val) => val.forEach(({ opr, dat }, _val) => {
      if (opr === 'next-line-2')
        val.set(_val, { opr: 'next-line', dat: dat });
      else if (opr === 'next-line')
        val.delete(_val);
    }));
  }

}
