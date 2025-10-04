import { UnityAsset, AssetDependency, DependencyGraph, ProjectSummary, CSharpScript, UnityScene, UnityPrefab } from '../types';
import { MetaFileParser, CSharpParser, UnityYAMLParser, FileHasher } from './unityParsers';

export interface UnityProjectStructure {
  assets: UnityAsset[];
  scripts: CSharpScript[];
  scenes: UnityScene[];
  prefabs: UnityPrefab[];
  dependencies: AssetDependency[];
}

export class UnityProjectAnalyzer {
  private projectPath: string;
  private projectId: string;
  private guidToAssetMap: Map<string, UnityAsset> = new Map();

  constructor(projectPath: string, projectId: string) {
    this.projectPath = projectPath;
    this.projectId = projectId;
  }

  async analyzeProject(): Promise<UnityProjectStructure> {
    const assets: UnityAsset[] = [];
    const scripts: CSharpScript[] = [];
    const scenes: UnityScene[] = [];
    const prefabs: UnityPrefab[] = [];
    const dependencies: AssetDependency[] = [];

    return {
      assets,
      scripts,
      scenes,
      prefabs,
      dependencies,
    };
  }

  async parseFile(filePath: string, content: string): Promise<void> {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'meta':
        await this.parseMeta(filePath, content);
        break;
      case 'cs':
        await this.parseScript(filePath, content);
        break;
      case 'unity':
        await this.parseScene(filePath, content);
        break;
      case 'prefab':
        await this.parsePrefab(filePath, content);
        break;
    }
  }

  private async parseMeta(filePath: string, content: string): Promise<void> {
    const metaData = MetaFileParser.parse(content);
    if (metaData) {
      const assetPath = filePath.replace('.meta', '');
      const extension = assetPath.split('.').pop()?.toLowerCase();

      let assetType: UnityAsset['asset_type'] = 'other';
      if (extension === 'cs') assetType = 'cs_script';
      else if (extension === 'unity') assetType = 'scene';
      else if (extension === 'prefab') assetType = 'prefab';
      else if (extension === 'shader') assetType = 'shader';
      else if (extension === 'mat') assetType = 'material';
      else if (['png', 'jpg', 'jpeg', 'tga'].includes(extension || '')) assetType = 'texture';

      const hash = await FileHasher.hash(content);

      const asset: UnityAsset = {
        id: crypto.randomUUID(),
        project_id: this.projectId,
        asset_path: assetPath,
        asset_type: assetType,
        guid: metaData.guid,
        file_hash: hash,
        last_parsed_at: new Date().toISOString(),
        parse_metadata: { fileFormatVersion: metaData.fileFormatVersion },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.guidToAssetMap.set(metaData.guid, asset);
    }
  }

  private async parseScript(filePath: string, content: string): Promise<CSharpScript | null> {
    const scriptData = CSharpParser.parse(content, filePath);
    if (!scriptData) return null;

    const asset = this.findAssetByPath(filePath);
    if (!asset) return null;

    const script: CSharpScript = {
      id: crypto.randomUUID(),
      asset_id: asset.id,
      namespace: scriptData.namespace || '',
      class_name: scriptData.class_name || '',
      base_types: scriptData.base_types || [],
      methods: scriptData.methods || [],
      fields: scriptData.fields || [],
      unity_messages: scriptData.unity_messages || [],
      component_usages: scriptData.component_usages || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return script;
  }

  private async parseScene(filePath: string, content: string): Promise<UnityScene | null> {
    const sceneData = UnityYAMLParser.parseScene(content);
    if (!sceneData) return null;

    const asset = this.findAssetByPath(filePath);
    if (!asset) return null;

    const sceneName = filePath.split('/').pop()?.replace('.unity', '') || 'Scene';

    const scene: UnityScene = {
      id: crypto.randomUUID(),
      asset_id: asset.id,
      scene_name: sceneName,
      game_objects: sceneData.game_objects || [],
      script_references: sceneData.script_references || [],
      prefab_references: sceneData.prefab_references || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return scene;
  }

  private async parsePrefab(filePath: string, content: string): Promise<UnityPrefab | null> {
    const prefabData = UnityYAMLParser.parsePrefab(content);
    if (!prefabData) return null;

    const asset = this.findAssetByPath(filePath);
    if (!asset) return null;

    const prefabName = filePath.split('/').pop()?.replace('.prefab', '') || 'Prefab';

    const prefab: UnityPrefab = {
      id: crypto.randomUUID(),
      asset_id: asset.id,
      prefab_name: prefabName,
      root_object: prefabData.root_object || { name: prefabName, fileID: '0', components: [], children: [] },
      components: prefabData.components || [],
      script_references: prefabData.script_references || [],
      nested_prefab_references: prefabData.nested_prefab_references || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return prefab;
  }

  private findAssetByPath(path: string): UnityAsset | undefined {
    for (const asset of this.guidToAssetMap.values()) {
      if (asset.asset_path === path) {
        return asset;
      }
    }
    return undefined;
  }

  buildDependencyGraph(structure: UnityProjectStructure): DependencyGraph {
    const nodes = structure.assets.map(asset => ({
      guid: asset.guid,
      name: asset.asset_path.split('/').pop() || '',
      type: asset.asset_type,
      path: asset.asset_path,
    }));

    const edges = structure.dependencies.map(dep => ({
      source: dep.source_guid,
      target: dep.target_guid,
      type: dep.dependency_type,
    }));

    return { nodes, edges };
  }

  generateProjectSummary(structure: UnityProjectStructure): ProjectSummary {
    const scriptCategories: Record<string, number> = {};

    structure.scripts.forEach(script => {
      const category = script.base_types.includes('MonoBehaviour')
        ? 'MonoBehaviour'
        : script.base_types.includes('ScriptableObject')
        ? 'ScriptableObject'
        : 'Other';

      scriptCategories[category] = (scriptCategories[category] || 0) + 1;
    });

    const referenceCounts = new Map<string, number>();
    structure.dependencies.forEach(dep => {
      referenceCounts.set(dep.target_guid, (referenceCounts.get(dep.target_guid) || 0) + 1);
    });

    const mostReferenced = Array.from(referenceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([guid, count]) => {
        const asset = structure.assets.find(a => a.guid === guid);
        return {
          guid,
          name: asset?.asset_path.split('/').pop() || 'Unknown',
          reference_count: count,
        };
      });

    return {
      total_scripts: structure.scripts.length,
      total_scenes: structure.scenes.length,
      total_prefabs: structure.prefabs.length,
      total_assets: structure.assets.length,
      script_categories: scriptCategories,
      most_referenced_assets: mostReferenced,
      dependency_depth: this.calculateDependencyDepth(structure),
    };
  }

  private calculateDependencyDepth(structure: UnityProjectStructure): number {
    const visited = new Set<string>();
    let maxDepth = 0;

    const dfs = (guid: string, depth: number) => {
      if (visited.has(guid)) return;
      visited.add(guid);
      maxDepth = Math.max(maxDepth, depth);

      const deps = structure.dependencies.filter(d => d.source_guid === guid);
      deps.forEach(dep => dfs(dep.target_guid, depth + 1));
    };

    structure.assets.forEach(asset => {
      if (!visited.has(asset.guid)) {
        dfs(asset.guid, 0);
      }
    });

    return maxDepth;
  }

  static getAssetTypeColor(type: string): string {
    const colors: Record<string, string> = {
      cs_script: '#00FF00',
      scene: '#FF6B6B',
      prefab: '#4ECDC4',
      shader: '#FFE66D',
      material: '#A8DADC',
      texture: '#F1C40F',
      other: '#95A5A6',
    };
    return colors[type] || colors.other;
  }

  static getAssetTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      cs_script: '📄',
      scene: '🎬',
      prefab: '🧩',
      shader: '✨',
      material: '🎨',
      texture: '🖼️',
      other: '📦',
    };
    return icons[type] || icons.other;
  }
}
