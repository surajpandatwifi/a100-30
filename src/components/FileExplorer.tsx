import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, File } from 'lucide-react';
import { FileNode } from '../types';

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
}

const mockFileTree: FileNode[] = [
  {
    name: 'Assets',
    path: 'Assets',
    type: 'folder',
    children: [
      {
        name: 'Scripts',
        path: 'Assets/Scripts',
        type: 'folder',
        children: [
          {
            name: 'PlayerController.cs',
            path: 'Assets/Scripts/PlayerController.cs',
            type: 'file',
            extension: 'cs',
          },
          {
            name: 'GameManager.cs',
            path: 'Assets/Scripts/GameManager.cs',
            type: 'file',
            extension: 'cs',
          },
          {
            name: 'EnemyAI.cs',
            path: 'Assets/Scripts/EnemyAI.cs',
            type: 'file',
            extension: 'cs',
          },
        ],
      },
      {
        name: 'Scenes',
        path: 'Assets/Scenes',
        type: 'folder',
        children: [
          {
            name: 'MainMenu.unity',
            path: 'Assets/Scenes/MainMenu.unity',
            type: 'file',
            extension: 'unity',
          },
          {
            name: 'Level1.unity',
            path: 'Assets/Scenes/Level1.unity',
            type: 'file',
            extension: 'unity',
          },
        ],
      },
      {
        name: 'Prefabs',
        path: 'Assets/Prefabs',
        type: 'folder',
        children: [
          {
            name: 'Player.prefab',
            path: 'Assets/Prefabs/Player.prefab',
            type: 'file',
            extension: 'prefab',
          },
          {
            name: 'Enemy.prefab',
            path: 'Assets/Prefabs/Enemy.prefab',
            type: 'file',
            extension: 'prefab',
          },
        ],
      },
    ],
  },
];

function FileTreeNode({ node, onFileSelect, depth = 0 }: {
  node: FileNode;
  onFileSelect: (path: string) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  const getFileIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-cyan-400" />
      ) : (
        <Folder className="w-4 h-4 text-cyan-400" />
      );
    }

    if (node.extension === 'cs') {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }

    if (node.extension === 'unity' || node.extension === 'prefab') {
      return <FileCode className="w-4 h-4 text-blue-400" />;
    }

    return <File className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded text-sm text-slate-300 transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === 'folder' && (
          <span className="text-slate-500">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        {getFileIcon()}
        <span className="flex-1 text-left group-hover:text-white">{node.name}</span>
      </button>

      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  return (
    <div className="h-full bg-slate-900 overflow-y-auto p-2">
      <div className="mb-2 px-2">
        <p className="text-xs text-slate-500">Unity Project Explorer</p>
      </div>
      {mockFileTree.map((node) => (
        <FileTreeNode key={node.path} node={node} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
}
