export interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
}

export function parseIndentedTree(text: string): TreeNode | null {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return null;

  interface StackItem {
    node: TreeNode;
    depth: number;
  }

  let root: TreeNode | null = null;
  const stack: StackItem[] = [];
  let idCounter = 0;

  for (const line of lines) {
    const match = line.match(/^(\s*)(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const label = match[2].trim();
    if (!label) continue;

    const node: TreeNode = { id: `n_${idCounter++}`, label, children: [] };
    const depth = indent / 2;

    if (stack.length === 0) {
      root = node;
      stack.push({ node, depth });
    } else {
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }
      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node);
      } else {
        root = node;
      }
      stack.push({ node, depth });
    }
  }

  return root;
}
