export interface Project {
  id: string;
  name: string;
  path: string;
  unity_version: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string | null;
  title: string;
  model_provider: 'openai' | 'claude' | 'gemini' | 'codex';
  model_name: string;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ExecutionLog {
  id: string;
  session_id: string;
  action_type: string;
  target_path: string;
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
  details: Record<string, any>;
  created_at: string;
}

export interface FileSnapshot {
  id: string;
  session_id: string;
  file_path: string;
  content_before: string;
  content_after: string;
  created_at: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  extension?: string;
}

export interface UnityAsset {
  id: string;
  project_id: string;
  asset_path: string;
  asset_type: 'cs_script' | 'scene' | 'prefab' | 'meta' | 'shader' | 'material' | 'texture' | 'other';
  guid: string;
  file_hash: string;
  last_parsed_at: string;
  parse_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CSharpMethod {
  name: string;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  attributes: string[];
  isUnityMessage: boolean;
}

export interface CSharpField {
  name: string;
  type: string;
  attributes: string[];
  isSerializedField: boolean;
}

export interface CSharpScript {
  id: string;
  asset_id: string;
  namespace: string;
  class_name: string;
  base_types: string[];
  methods: CSharpMethod[];
  fields: CSharpField[];
  unity_messages: string[];
  component_usages: string[];
  created_at: string;
  updated_at: string;
}

export interface UnityGameObject {
  name: string;
  fileID: string;
  components: Array<{
    type: string;
    guid?: string;
    fileID: string;
  }>;
  children: UnityGameObject[];
}

export interface UnityScene {
  id: string;
  asset_id: string;
  scene_name: string;
  game_objects: UnityGameObject[];
  script_references: string[];
  prefab_references: string[];
  created_at: string;
  updated_at: string;
}

export interface UnityPrefab {
  id: string;
  asset_id: string;
  prefab_name: string;
  root_object: UnityGameObject;
  components: Array<{ type: string; guid?: string }>;
  script_references: string[];
  nested_prefab_references: string[];
  created_at: string;
  updated_at: string;
}

export interface AssetDependency {
  id: string;
  project_id: string;
  source_guid: string;
  target_guid: string;
  dependency_type: 'script_usage' | 'prefab_instance' | 'scene_reference' | 'material_reference' | 'texture_reference';
  metadata: Record<string, any>;
  created_at: string;
}

export interface DependencyGraph {
  nodes: Array<{
    guid: string;
    name: string;
    type: string;
    path: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

export interface ProjectAnalysisCache {
  id: string;
  project_id: string;
  analysis_type: 'dependency_graph' | 'project_summary' | 'script_index' | 'scene_index';
  cache_data: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  total_scripts: number;
  total_scenes: number;
  total_prefabs: number;
  total_assets: number;
  script_categories: Record<string, number>;
  most_referenced_assets: Array<{ guid: string; name: string; reference_count: number }>;
  dependency_depth: number;
}
