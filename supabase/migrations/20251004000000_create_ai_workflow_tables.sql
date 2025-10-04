/*
  # AI Workflow Engine Database Schema

  1. New Tables
    - `execution_plans`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key) - Reference to chat session
      - `plan_id` (text) - Unique plan identifier
      - `title` (text) - Plan title
      - `description` (text) - Detailed plan description
      - `operations` (jsonb) - Array of file operations
      - `estimated_duration` (integer) - Estimated duration in seconds
      - `risks` (jsonb) - Array of identified risks
      - `prerequisites` (jsonb) - Array of prerequisites
      - `success_criteria` (jsonb) - Array of success criteria
      - `rollback_strategy` (text) - Rollback strategy description
      - `status` (text) - draft, approved, rejected, executing, completed, failed, rolled_back
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `plan_approvals`
      - `id` (uuid, primary key)
      - `plan_id` (text) - Reference to execution plan
      - `session_id` (uuid, foreign key) - Reference to chat session
      - `approved_by` (text) - User identifier
      - `rejection_reason` (text) - Reason for rejection if applicable
      - `approved_at` (timestamptz)

    - `plan_executions`
      - `id` (uuid, primary key)
      - `plan_id` (text) - Reference to execution plan
      - `session_id` (uuid, foreign key) - Reference to chat session
      - `total_operations` (integer) - Total operations count
      - `completed_operations` (integer) - Completed operations count
      - `failed_operations` (integer) - Failed operations count
      - `operation_results` (jsonb) - Array of operation results
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `unity_assets`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key) - Reference to project
      - `asset_path` (text) - Path to asset file
      - `asset_type` (text) - cs_script, scene, prefab, meta, shader, material, texture, other
      - `guid` (text) - Unity GUID
      - `file_hash` (text) - Hash of file content
      - `last_parsed_at` (timestamptz)
      - `parse_metadata` (jsonb) - Parsing metadata
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `csharp_scripts`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key) - Reference to unity_assets
      - `namespace` (text) - Script namespace
      - `class_name` (text) - Class name
      - `base_types` (jsonb) - Array of base types
      - `methods` (jsonb) - Array of method definitions
      - `fields` (jsonb) - Array of field definitions
      - `unity_messages` (jsonb) - Array of Unity message methods
      - `component_usages` (jsonb) - Array of component usages
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `unity_scenes`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key) - Reference to unity_assets
      - `scene_name` (text) - Scene name
      - `game_objects` (jsonb) - Array of game objects
      - `script_references` (jsonb) - Array of script references
      - `prefab_references` (jsonb) - Array of prefab references
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `unity_prefabs`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key) - Reference to unity_assets
      - `prefab_name` (text) - Prefab name
      - `root_object` (jsonb) - Root game object
      - `components` (jsonb) - Array of components
      - `script_references` (jsonb) - Array of script references
      - `nested_prefab_references` (jsonb) - Array of nested prefab references
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `asset_dependencies`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key) - Reference to project
      - `source_guid` (text) - Source asset GUID
      - `target_guid` (text) - Target asset GUID
      - `dependency_type` (text) - script_usage, prefab_instance, scene_reference, material_reference, texture_reference
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz)

    - `project_analysis_cache`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key) - Reference to project
      - `analysis_type` (text) - dependency_graph, project_summary, script_index, scene_index
      - `cache_data` (jsonb) - Cached analysis data
      - `version` (integer) - Cache version
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (local dev tool)

  3. Important Notes
    - Designed for AI workflow execution and Unity project analysis
    - JSONB fields store complex structured data
    - Foreign keys maintain referential integrity
    - Indexes optimize query performance
*/

-- Create execution_plans table
CREATE TABLE IF NOT EXISTS execution_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  plan_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text DEFAULT '',
  operations jsonb DEFAULT '[]'::jsonb,
  estimated_duration integer DEFAULT 60,
  risks jsonb DEFAULT '[]'::jsonb,
  prerequisites jsonb DEFAULT '[]'::jsonb,
  success_criteria jsonb DEFAULT '[]'::jsonb,
  rollback_strategy text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create plan_approvals table
CREATE TABLE IF NOT EXISTS plan_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  approved_by text NOT NULL,
  rejection_reason text DEFAULT '',
  approved_at timestamptz DEFAULT now()
);

-- Create plan_executions table
CREATE TABLE IF NOT EXISTS plan_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  total_operations integer DEFAULT 0,
  completed_operations integer DEFAULT 0,
  failed_operations integer DEFAULT 0,
  operation_results jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create unity_assets table
CREATE TABLE IF NOT EXISTS unity_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  asset_path text NOT NULL,
  asset_type text NOT NULL,
  guid text NOT NULL,
  file_hash text DEFAULT '',
  last_parsed_at timestamptz DEFAULT now(),
  parse_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create csharp_scripts table
CREATE TABLE IF NOT EXISTS csharp_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES unity_assets(id) ON DELETE CASCADE,
  namespace text DEFAULT '',
  class_name text DEFAULT '',
  base_types jsonb DEFAULT '[]'::jsonb,
  methods jsonb DEFAULT '[]'::jsonb,
  fields jsonb DEFAULT '[]'::jsonb,
  unity_messages jsonb DEFAULT '[]'::jsonb,
  component_usages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unity_scenes table
CREATE TABLE IF NOT EXISTS unity_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES unity_assets(id) ON DELETE CASCADE,
  scene_name text NOT NULL,
  game_objects jsonb DEFAULT '[]'::jsonb,
  script_references jsonb DEFAULT '[]'::jsonb,
  prefab_references jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unity_prefabs table
CREATE TABLE IF NOT EXISTS unity_prefabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES unity_assets(id) ON DELETE CASCADE,
  prefab_name text NOT NULL,
  root_object jsonb DEFAULT '{}'::jsonb,
  components jsonb DEFAULT '[]'::jsonb,
  script_references jsonb DEFAULT '[]'::jsonb,
  nested_prefab_references jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create asset_dependencies table
CREATE TABLE IF NOT EXISTS asset_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  source_guid text NOT NULL,
  target_guid text NOT NULL,
  dependency_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create project_analysis_cache table
CREATE TABLE IF NOT EXISTS project_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  cache_data jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unity_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE csharp_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unity_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE unity_prefabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (local dev tool)
CREATE POLICY "Allow all operations on execution_plans"
  ON execution_plans FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on plan_approvals"
  ON plan_approvals FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on plan_executions"
  ON plan_executions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on unity_assets"
  ON unity_assets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on csharp_scripts"
  ON csharp_scripts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on unity_scenes"
  ON unity_scenes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on unity_prefabs"
  ON unity_prefabs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on asset_dependencies"
  ON asset_dependencies FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on project_analysis_cache"
  ON project_analysis_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_execution_plans_session_id ON execution_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_execution_plans_plan_id ON execution_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_execution_plans_status ON execution_plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_approvals_plan_id ON plan_approvals(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_executions_plan_id ON plan_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_unity_assets_project_id ON unity_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_unity_assets_guid ON unity_assets(guid);
CREATE INDEX IF NOT EXISTS idx_unity_assets_asset_type ON unity_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_csharp_scripts_asset_id ON csharp_scripts(asset_id);
CREATE INDEX IF NOT EXISTS idx_unity_scenes_asset_id ON unity_scenes(asset_id);
CREATE INDEX IF NOT EXISTS idx_unity_prefabs_asset_id ON unity_prefabs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_dependencies_project_id ON asset_dependencies(project_id);
CREATE INDEX IF NOT EXISTS idx_asset_dependencies_source_guid ON asset_dependencies(source_guid);
CREATE INDEX IF NOT EXISTS idx_asset_dependencies_target_guid ON asset_dependencies(target_guid);
CREATE INDEX IF NOT EXISTS idx_project_analysis_cache_project_id ON project_analysis_cache(project_id);
CREATE INDEX IF NOT EXISTS idx_project_analysis_cache_type ON project_analysis_cache(analysis_type);
