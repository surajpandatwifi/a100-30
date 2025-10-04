import { UnityAsset, CSharpScript, UnityScene, UnityPrefab, DependencyGraph } from '../../types';

export interface ProjectContext {
  projectInfo: {
    name: string;
    path: string;
    unityVersion: string;
  };
  relevantFiles: FileContext[];
  dependencies: string[];
  relatedAssets: UnityAsset[];
  summary: string;
}

export interface FileContext {
  path: string;
  type: 'script' | 'scene' | 'prefab' | 'other';
  content?: string;
  metadata?: any;
  relevanceScore: number;
}

export interface ContextBuildOptions {
  maxFiles?: number;
  maxTokens?: number;
  includeReferences?: boolean;
  includeDependencies?: boolean;
  focusAreas?: string[];
}

export class ContextBuilder {
  private projectPath: string;
  private projectName: string;
  private unityVersion: string;

  constructor(projectPath: string, projectName: string, unityVersion: string) {
    this.projectPath = projectPath;
    this.projectName = projectName;
    this.unityVersion = unityVersion;
  }

  async buildContext(
    targetFiles: string[],
    allAssets: UnityAsset[],
    scripts: CSharpScript[],
    scenes: UnityScene[],
    prefabs: UnityPrefab[],
    dependencyGraph: DependencyGraph,
    options: ContextBuildOptions = {}
  ): Promise<ProjectContext> {
    const {
      maxFiles = 20,
      includeReferences = true,
      includeDependencies = true,
      focusAreas = []
    } = options;

    const relevantFiles: FileContext[] = [];
    const dependencies: string[] = [];
    const relatedAssets: UnityAsset[] = [];

    for (const targetPath of targetFiles) {
      const asset = allAssets.find(a => a.asset_path === targetPath);
      if (!asset) continue;

      relevantFiles.push({
        path: targetPath,
        type: this.getFileType(asset.asset_type),
        relevanceScore: 1.0,
        metadata: { guid: asset.guid, assetType: asset.asset_type }
      });

      if (includeReferences) {
        const refs = this.findReferences(asset.guid, dependencyGraph, allAssets, scripts);
        refs.forEach(ref => {
          if (!relevantFiles.some(f => f.path === ref.path) && relevantFiles.length < maxFiles) {
            relevantFiles.push(ref);
          }
        });
      }

      if (includeDependencies) {
        const deps = this.findDependencies(asset.guid, dependencyGraph, allAssets);
        deps.forEach(dep => {
          if (!dependencies.includes(dep) && dependencies.length < maxFiles) {
            dependencies.push(dep);
            const depAsset = allAssets.find(a => a.guid === dep);
            if (depAsset && !relatedAssets.some(a => a.guid === dep)) {
              relatedAssets.push(depAsset);
            }
          }
        });
      }
    }

    relevantFiles.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const summary = this.generateSummary(
      targetFiles,
      relevantFiles,
      dependencies,
      focusAreas
    );

    return {
      projectInfo: {
        name: this.projectName,
        path: this.projectPath,
        unityVersion: this.unityVersion
      },
      relevantFiles: relevantFiles.slice(0, maxFiles),
      dependencies,
      relatedAssets,
      summary
    };
  }

  async buildContextForTask(
    taskDescription: string,
    allAssets: UnityAsset[],
    scripts: CSharpScript[],
    options: ContextBuildOptions = {}
  ): Promise<ProjectContext> {
    const keywords = this.extractKeywords(taskDescription);

    const relevantScripts = scripts.filter(script =>
      this.matchesKeywords(script, keywords)
    ).slice(0, options.maxFiles || 10);

    const relevantAssets = relevantScripts
      .map(script => allAssets.find(a => a.id === script.asset_id))
      .filter((a): a is UnityAsset => a !== undefined);

    const relevantFiles: FileContext[] = relevantAssets.map(asset => ({
      path: asset.asset_path,
      type: 'script',
      relevanceScore: 0.8,
      metadata: { guid: asset.guid }
    }));

    const summary = `Task: ${taskDescription}\nRelevant files found: ${relevantFiles.length}`;

    return {
      projectInfo: {
        name: this.projectName,
        path: this.projectPath,
        unityVersion: this.unityVersion
      },
      relevantFiles,
      dependencies: [],
      relatedAssets: relevantAssets,
      summary
    };
  }

  private getFileType(assetType: string): 'script' | 'scene' | 'prefab' | 'other' {
    switch (assetType) {
      case 'cs_script':
        return 'script';
      case 'scene':
        return 'scene';
      case 'prefab':
        return 'prefab';
      default:
        return 'other';
    }
  }

  private findReferences(
    guid: string,
    graph: DependencyGraph,
    assets: UnityAsset[],
    scripts: CSharpScript[]
  ): FileContext[] {
    const references: FileContext[] = [];

    const incomingEdges = graph.edges.filter(e => e.target === guid);

    incomingEdges.forEach(edge => {
      const sourceAsset = assets.find(a => a.guid === edge.source);
      if (sourceAsset) {
        references.push({
          path: sourceAsset.asset_path,
          type: this.getFileType(sourceAsset.asset_type),
          relevanceScore: 0.7,
          metadata: {
            guid: sourceAsset.guid,
            dependencyType: edge.type
          }
        });
      }
    });

    return references;
  }

  private findDependencies(
    guid: string,
    graph: DependencyGraph,
    assets: UnityAsset[]
  ): string[] {
    const dependencies: string[] = [];
    const visited = new Set<string>();

    const traverse = (currentGuid: string, depth: number) => {
      if (depth > 2 || visited.has(currentGuid)) return;
      visited.add(currentGuid);

      const edges = graph.edges.filter(e => e.source === currentGuid);
      edges.forEach(edge => {
        if (!dependencies.includes(edge.target)) {
          dependencies.push(edge.target);
        }
        traverse(edge.target, depth + 1);
      });
    };

    traverse(guid, 0);
    return dependencies;
  }

  private generateSummary(
    targetFiles: string[],
    relevantFiles: FileContext[],
    dependencies: string[],
    focusAreas: string[]
  ): string {
    const summary = [
      `Project: ${this.projectName}`,
      `Unity Version: ${this.unityVersion}`,
      `Target Files: ${targetFiles.length}`,
      `Relevant Context Files: ${relevantFiles.length}`,
      `Dependencies: ${dependencies.length}`,
    ];

    if (focusAreas.length > 0) {
      summary.push(`Focus Areas: ${focusAreas.join(', ')}`);
    }

    const fileTypes = relevantFiles.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    summary.push(`File Types: ${Object.entries(fileTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}`);

    return summary.join('\n');
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    return [...new Set(words)];
  }

  private matchesKeywords(script: CSharpScript, keywords: string[]): boolean {
    const searchText = [
      script.class_name,
      script.namespace,
      ...script.methods.map(m => m.name),
      ...script.fields.map(f => f.name)
    ].join(' ').toLowerCase();

    return keywords.some(keyword => searchText.includes(keyword));
  }

  formatContextForPrompt(context: ProjectContext, includeContent = false): string {
    const lines = [
      '=== PROJECT CONTEXT ===',
      '',
      `Project: ${context.projectInfo.name}`,
      `Unity Version: ${context.projectInfo.unityVersion}`,
      `Path: ${context.projectInfo.path}`,
      '',
      '=== SUMMARY ===',
      context.summary,
      '',
      '=== RELEVANT FILES ===',
    ];

    context.relevantFiles.forEach(file => {
      lines.push(`\n${file.path} (${file.type}, relevance: ${file.relevanceScore.toFixed(2)})`);
      if (includeContent && file.content) {
        lines.push('```');
        lines.push(file.content);
        lines.push('```');
      }
    });

    if (context.dependencies.length > 0) {
      lines.push('');
      lines.push('=== DEPENDENCIES ===');
      context.dependencies.forEach(dep => {
        const asset = context.relatedAssets.find(a => a.guid === dep);
        if (asset) {
          lines.push(`- ${asset.asset_path} (${asset.asset_type})`);
        }
      });
    }

    return lines.join('\n');
  }
}
