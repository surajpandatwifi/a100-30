import { useState, useCallback } from 'react';
import { UnityAsset, DependencyGraph, ProjectSummary, CSharpScript, UnityScene, UnityPrefab } from '../types';
import { UnityProjectAnalyzer, UnityProjectStructure } from '../services/unityAnalyzer';

interface UseUnityAnalyzerReturn {
  assets: UnityAsset[];
  scripts: CSharpScript[];
  scenes: UnityScene[];
  prefabs: UnityPrefab[];
  dependencyGraph: DependencyGraph | null;
  projectSummary: ProjectSummary | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeProject: (projectPath: string, projectId: string) => Promise<void>;
  clearAnalysis: () => void;
}

export function useUnityAnalyzer(): UseUnityAnalyzerReturn {
  const [assets, setAssets] = useState<UnityAsset[]>([]);
  const [scripts, setScripts] = useState<CSharpScript[]>([]);
  const [scenes, setScenes] = useState<UnityScene[]>([]);
  const [prefabs, setPrefabs] = useState<UnityPrefab[]>([]);
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraph | null>(null);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProject = useCallback(async (projectPath: string, projectId: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analyzer = new UnityProjectAnalyzer(projectPath, projectId);

      const structure = await analyzer.analyzeProject();

      setAssets(structure.assets);
      setScripts(structure.scripts);
      setScenes(structure.scenes);
      setPrefabs(structure.prefabs);

      const graph = analyzer.buildDependencyGraph(structure);
      setDependencyGraph(graph);

      const summary = analyzer.generateProjectSummary(structure);
      setProjectSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze project');
      console.error('Unity analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAssets([]);
    setScripts([]);
    setScenes([]);
    setPrefabs([]);
    setDependencyGraph(null);
    setProjectSummary(null);
    setError(null);
  }, []);

  return {
    assets,
    scripts,
    scenes,
    prefabs,
    dependencyGraph,
    projectSummary,
    isAnalyzing,
    error,
    analyzeProject,
    clearAnalysis,
  };
}
