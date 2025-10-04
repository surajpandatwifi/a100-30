import { useState, useEffect } from 'react';
import { FileCode, Film, Box, Sparkles, Palette, Image as ImageIcon, Package, ChevronRight, ChevronDown } from 'lucide-react';
import { UnityAsset } from '../types';
import { UnityProjectAnalyzer } from '../services/unityAnalyzer';

interface UnityProjectMapProps {
  projectId: string;
  assets: UnityAsset[];
  onAssetSelect?: (asset: UnityAsset) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  assetType?: UnityAsset['asset_type'];
  children: TreeNode[];
  asset?: UnityAsset;
}

export default function UnityProjectMap({ projectId, assets, onAssetSelect }: UnityProjectMapProps) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
  const [selectedAsset, setSelectedAsset] = useState<UnityAsset | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    buildTree();
  }, [assets, filterType]);

  const buildTree = () => {
    const root: TreeNode = {
      name: 'Assets',
      path: '/',
      type: 'folder',
      children: [],
    };

    const filteredAssets = filterType === 'all'
      ? assets
      : assets.filter(a => a.asset_type === filterType);

    filteredAssets.forEach(asset => {
      const parts = asset.asset_path.split('/');
      let currentNode = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const currentPath = '/' + parts.slice(0, index + 1).join('/');

        let childNode = currentNode.children.find(c => c.name === part);

        if (!childNode) {
          childNode = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'folder',
            assetType: isLast ? asset.asset_type : undefined,
            children: [],
            asset: isLast ? asset : undefined,
          };
          currentNode.children.push(childNode);
        }

        currentNode = childNode;
      });
    });

    sortTree(root);
    setTree(root);
  };

  const sortTree = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    node.children.forEach(child => sortTree(child));
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleAssetClick = (asset: UnityAsset) => {
    setSelectedAsset(asset);
    onAssetSelect?.(asset);
  };

  const getAssetIcon = (assetType: UnityAsset['asset_type']) => {
    const iconMap = {
      cs_script: FileCode,
      scene: Film,
      prefab: Box,
      shader: Sparkles,
      material: Palette,
      texture: ImageIcon,
      other: Package,
    };
    const Icon = iconMap[assetType] || Package;
    return <Icon className="w-4 h-4" />;
  };

  const getAssetColor = (assetType: UnityAsset['asset_type']) => {
    return UnityProjectAnalyzer.getAssetTypeColor(assetType);
  };

  const renderTree = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedAsset?.id === node.asset?.id;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${
            isSelected ? 'bg-white text-black' : 'hover:bg-[#2F4F4F]'
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleExpand(node.path);
            } else if (node.asset) {
              handleAssetClick(node.asset);
            }
          }}
        >
          {node.type === 'folder' && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {node.type === 'file' && node.assetType && (
            <span className="flex-shrink-0" style={{ color: getAssetColor(node.assetType) }}>
              {getAssetIcon(node.assetType)}
            </span>
          )}
          <span className="text-sm truncate">{node.name}</span>
          {hasChildren && (
            <span className="text-xs text-gray-400 ml-auto">({node.children.length})</span>
          )}
        </div>
        {node.type === 'folder' && isExpanded && (
          <div>
            {node.children.map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const assetTypeCounts = assets.reduce((acc, asset) => {
    acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="border-b border-[#2F4F4F] p-3">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">Project Structure</h3>
          <span className="text-xs text-gray-400">({assets.length} assets)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filterType === 'all'
                ? 'bg-white text-black font-medium'
                : 'bg-[#2F4F4F] text-gray-300 hover:bg-[#36454F]'
            }`}
          >
            All ({assets.length})
          </button>
          {Object.entries(assetTypeCounts).map(([type, count]) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                filterType === type
                  ? 'bg-white text-black font-medium'
                  : 'bg-[#2F4F4F] text-gray-300 hover:bg-[#36454F]'
              }`}
            >
              <span style={{ color: filterType === type ? '#000' : getAssetColor(type as UnityAsset['asset_type']) }}>
                {getAssetIcon(type as UnityAsset['asset_type'])}
              </span>
              {type} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto text-gray-300">
        {tree && renderTree(tree)}
      </div>
    </div>
  );
}
