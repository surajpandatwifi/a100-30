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
