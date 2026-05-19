import { TreeNode } from './treeParser';

export interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
}

export interface TreeLayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  levelHeight: number;
  siblingSpacing: number;
}

export function calculateTreeLayout(
  root: TreeNode,
  options: TreeLayoutOptions
): LayoutNode {
  interface SNode {
    id: string;
    label: string;
    children: SNode[];
    subtreeWidth: number;
    x: number;
    y: number;
  }

  function buildSNode(node: TreeNode, depth: number): SNode {
    const children = node.children.map(c => buildSNode(c, depth + 1));
    let subtreeWidth = options.nodeWidth;
    
    if (children.length > 0) {
      subtreeWidth = children.reduce((sum, c) => sum + c.subtreeWidth, 0) + (children.length - 1) * options.siblingSpacing;
      subtreeWidth = Math.max(subtreeWidth, options.nodeWidth);
    }
    
    return {
      id: node.id,
      label: node.label,
      children,
      subtreeWidth,
      x: 0,
      y: depth * options.levelHeight
    };
  }

  const sRoot = buildSNode(root, 0);

  function assignPositions(node: SNode, startX: number) {
    if (node.children.length === 0) {
      node.x = startX + node.subtreeWidth / 2;
    } else {
      let currentX = startX;
      for (const child of node.children) {
        assignPositions(child, currentX);
        currentX += child.subtreeWidth + options.siblingSpacing;
      }
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;
    }
  }

  assignPositions(sRoot, 0);

  function mapToLayoutNode(node: SNode): LayoutNode {
    return {
      id: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      width: options.nodeWidth,
      height: options.nodeHeight,
      children: node.children.map(mapToLayoutNode)
    };
  }

  return mapToLayoutNode(sRoot);
}
