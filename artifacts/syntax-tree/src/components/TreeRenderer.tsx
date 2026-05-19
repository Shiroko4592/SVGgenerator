import React, { useRef, useMemo, useEffect, useState } from 'react';
import { calculateTreeLayout, LayoutNode, TreeLayoutOptions } from '@/lib/treeLayout';
import { TreeNode } from '@/lib/treeParser';

export interface TreeRendererProps {
  tree: TreeNode | null;
  lineStyle: 'straight' | 'curved';
  theme: 'light' | 'dark' | 'colorful';
  fontSize: number;
}

export const TreeRenderer: React.FC<TreeRendererProps> = ({
  tree,
  lineStyle,
  theme,
  fontSize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const options: TreeLayoutOptions = {
    nodeWidth: fontSize * 4,
    nodeHeight: fontSize * 2.5,
    levelHeight: fontSize * 6,
    siblingSpacing: fontSize * 2
  };

  const layout = useMemo(() => {
    if (!tree) return null;
    return calculateTreeLayout(tree, options);
  }, [tree, options.nodeWidth, options.nodeHeight, options.levelHeight, options.siblingSpacing]);

  if (!tree || !layout) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif italic">
        트리를 시각화하려면 왼쪽 입력창에 텍스트를 작성하세요.
      </div>
    );
  }

  // Calculate SVG bounds
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function findBounds(node: LayoutNode) {
    minX = Math.min(minX, node.x - node.width / 2);
    maxX = Math.max(maxX, node.x + node.width / 2);
    maxY = Math.max(maxY, node.y + node.height);
    node.children.forEach(findBounds);
  }
  findBounds(layout);

  const padding = 40;
  const svgWidth = Math.max(containerRef.current?.clientWidth || 0, maxX - minX + padding * 2);
  const svgHeight = Math.max(containerRef.current?.clientHeight || 0, maxY + padding * 2);
  const offsetX = -minX + padding + Math.max(0, (svgWidth - (maxX - minX + padding * 2)) / 2);
  const offsetY = padding;

  const renderLines = (node: LayoutNode): React.ReactNode[] => {
    return node.children.flatMap(child => {
      const startX = node.x + offsetX;
      const startY = node.y + offsetY + node.height / 2;
      const endX = child.x + offsetX;
      const endY = child.y + offsetY - child.height / 2;

      let d = '';
      if (lineStyle === 'curved') {
        const midY = (startY + endY) / 2;
        d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
      } else {
        d = `M ${startX} ${startY} L ${endX} ${endY}`;
      }

      const lines = [
        <path
          key={`line-${node.id}-${child.id}`}
          d={d}
          fill="none"
          stroke={theme === 'dark' ? '#cbd5e1' : '#475569'}
          strokeWidth="2"
          className="transition-all duration-300"
        />,
        ...renderLines(child)
      ];
      return lines;
    });
  };

  const renderNodes = (node: LayoutNode, depth = 0): React.ReactNode[] => {
    const x = node.x + offsetX - node.width / 2;
    const y = node.y + offsetY - node.height / 2;

    let bgFill = 'hsl(var(--card))';
    let textFill = 'hsl(var(--card-foreground))';
    let stroke = 'hsl(var(--border))';

    if (theme === 'colorful') {
      const colors = [
        ['#eff6ff', '#1e293b', '#bfdbfe'],
        ['#f0fdf4', '#1e293b', '#bbf7d0'],
        ['#fefce8', '#1e293b', '#fef08a'],
        ['#fff1f2', '#1e293b', '#fde047'],
        ['#fdf2f8', '#1e293b', '#fecdd3'],
      ];
      const colorSet = colors[depth % colors.length];
      bgFill = colorSet[0];
      textFill = colorSet[1];
      stroke = colorSet[2];
    } else if (theme === 'dark') {
      bgFill = '#1e293b';
      textFill = '#f8fafc';
      stroke = '#334155';
    }

    const nodes = [
      <g key={`node-${node.id}`} className="transition-all duration-300">
        <rect
          x={x}
          y={y}
          width={node.width}
          height={node.height}
          rx={6}
          fill={bgFill}
          stroke={stroke}
          strokeWidth="2"
        />
        <text
          x={node.x + offsetX}
          y={node.y + offsetY}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={textFill}
          fontSize={fontSize}
          fontFamily="var(--app-font-sans)"
          fontWeight="500"
        >
          {node.label}
        </text>
      </g>,
      ...node.children.flatMap(c => renderNodes(c, depth + 1))
    ];
    return nodes;
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-background rounded-lg border shadow-inner">
      <svg
        id="tree-svg"
        width={svgWidth}
        height={svgHeight}
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <style>
          {`
            text { font-family: 'Noto Sans KR', sans-serif; }
          `}
        </style>
        {renderLines(layout)}
        {renderNodes(layout)}
      </svg>
    </div>
  );
};
