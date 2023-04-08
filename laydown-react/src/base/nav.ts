

export type NavNode = {
  name: string;
  href?: string;
  children?: NavNode[];
};

export type HierarchicalNavNode = NavNode & {
  hierarchy: number;
  children?: HierarchicalNavNode[];
};


export type NavRecordMap = {
  [key: string]: string | NavRecordMap
}

export const compileNavRecordMap = (record: NavRecordMap, indexKey = '', rootName = '') => {
  const rootNode: NavNode = { name: rootName ?? '' };
  record = JSON.parse(JSON.stringify(record));
  indexKey = indexKey ?? '';
  const stack: NavNode[] = [rootNode];
  const stack2: NavRecordMap[] = [record];
  while (stack2.length > 0) {
    let pushedNew = false;
    const currentRecord: NavRecordMap = stack2[stack2.length - 1];
    const currentNode: NavNode = stack[stack.length - 1];
    for (const name of Object.keys(currentRecord)) {
      const value = currentRecord[name];
      delete currentRecord[name];
      if (typeof value === 'string' || value instanceof String) {
        if (name === indexKey) {
          currentNode.href = String(value);
        } else {
          (currentNode.children = currentNode.children ?? [])
            .push({ name: name, href: String(value) });
        }
      } else { // value is nav node
        const newNode: NavNode = { name: name };
        (currentNode.children = currentNode.children ?? []).push(newNode);
        stack.push(newNode);
        stack2.push(value);
        pushedNew = true;
        break;
      }
    }
    if (!pushedNew && Object.keys(currentRecord).length === 0) {
      stack.pop();
      stack2.pop();
    }
  }
  return rootNode;
};

export type NavRecordList = {
  [key: string]: string | NavRecordList[];
};

export const iterateNavRecordList = (tree: NavRecordList[]): [string, string | NavRecordList[]][] => {
  return tree.map(x => [Object.keys(x)[0], x[Object.keys(x)[0]]]);
};