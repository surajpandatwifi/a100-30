import { useEffect, useRef, useState } from 'react';
import { DependencyGraph } from '../types';
import { UnityProjectAnalyzer } from '../services/unityAnalyzer';

interface DependencyGraphViewProps {
  graph: DependencyGraph;
  onNodeSelect?: (nodeGuid: string) => void;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  name: string;
  type: string;
  path: string;
  radius: number;
}

interface GraphEdge {
  source: GraphNode;
  target: GraphNode;
  type: string;
}

export default function DependencyGraphView({ graph, onNodeSelect }: DependencyGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    initializeGraph();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graph]);

  const initializeGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const newNodes: GraphNode[] = graph.nodes.map((node, index) => {
      const angle = (index / graph.nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;

      return {
        id: node.guid,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        name: node.name,
        type: node.type,
        path: node.path,
        radius: 8,
      };
    });

    const nodeMap = new Map(newNodes.map(n => [n.id, n]));
    const newEdges: GraphEdge[] = graph.edges
      .map(edge => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (source && target) {
          return { source, target, type: edge.type };
        }
        return null;
      })
      .filter((e): e is GraphEdge => e !== null);

    setNodes(newNodes);
    setEdges(newEdges);

    startSimulation(newNodes, newEdges);
  };

  const startSimulation = (graphNodes: GraphNode[], graphEdges: GraphEdge[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const simulate = () => {
      applyForces(graphNodes, graphEdges, canvas.width, canvas.height);
      updatePositions(graphNodes);
      render(ctx, graphNodes, graphEdges);
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();
  };

  const applyForces = (graphNodes: GraphNode[], graphEdges: GraphEdge[], width: number, height: number) => {
    const repulsionStrength = 1000;
    const attractionStrength = 0.01;
    const centerStrength = 0.001;
    const damping = 0.9;

    graphNodes.forEach(node => {
      node.vx *= damping;
      node.vy *= damping;

      const dx = width / 2 - node.x;
      const dy = height / 2 - node.y;
      node.vx += dx * centerStrength;
      node.vy += dy * centerStrength;
    });

    for (let i = 0; i < graphNodes.length; i++) {
      for (let j = i + 1; j < graphNodes.length; j++) {
        const nodeA = graphNodes[i];
        const nodeB = graphNodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = repulsionStrength / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        nodeA.vx -= fx;
        nodeA.vy -= fy;
        nodeB.vx += fx;
        nodeB.vy += fy;
      }
    }

    graphEdges.forEach(edge => {
      const dx = edge.target.x - edge.source.x;
      const dy = edge.target.y - edge.source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = distance * attractionStrength;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      edge.source.vx += fx;
      edge.source.vy += fy;
      edge.target.vx -= fx;
      edge.target.vy -= fy;
    });
  };

  const updatePositions = (graphNodes: GraphNode[]) => {
    graphNodes.forEach(node => {
      if (node === draggedNode) return;

      node.x += node.vx;
      node.y += node.vy;

      const margin = 50;
      const canvas = canvasRef.current;
      if (canvas) {
        node.x = Math.max(margin, Math.min(canvas.width - margin, node.x));
        node.y = Math.max(margin, Math.min(canvas.height - margin, node.y));
      }
    });
  };

  const render = (ctx: CanvasRenderingContext2D, graphNodes: GraphNode[], graphEdges: GraphEdge[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = '#2F4F4F';
    ctx.lineWidth = 1;
    graphEdges.forEach(edge => {
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      ctx.stroke();
    });

    graphNodes.forEach(node => {
      const color = UnityProjectAnalyzer.getAssetTypeColor(node.type);
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (isHovered) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - node.radius - 5);
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode) {
      setIsDragging(true);
      setDraggedNode(clickedNode);
      setSelectedNode(clickedNode);
      onNodeSelect?.(clickedNode.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && draggedNode) {
      draggedNode.x = x;
      draggedNode.y = y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else {
      const hovered = nodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius;
      });
      setHoveredNode(hovered || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="border-b border-[#2F4F4F] p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Dependency Graph</h3>
            <p className="text-xs text-gray-400 mt-1">
              {nodes.length} nodes, {edges.length} edges
            </p>
          </div>
          {selectedNode && (
            <div className="text-xs text-gray-300">
              <div className="font-medium">{selectedNode.name}</div>
              <div className="text-gray-400">{selectedNode.type}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
