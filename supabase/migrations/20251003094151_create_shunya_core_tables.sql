/*
  # Shunya Core Database Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text) - Project name
      - `path` (text) - Local file system path to Unity project
      - `unity_version` (text) - Unity version
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key) - Reference to project
      - `title` (text) - Session title/description
      - `model_provider` (text) - AI provider (openai, claude, gemini)
      - `model_name` (text) - Specific model name
      - `status` (text) - active, completed, failed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key) - Reference to chat session
      - `role` (text) - user, assistant, system
      - `content` (text) - Message content
      - `metadata` (jsonb) - Additional data (tokens, cost, etc)
      - `created_at` (timestamptz)
    
    - `execution_logs`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key) - Reference to chat session
      - `action_type` (text) - file_read, file_write, file_delete, git_commit, etc
      - `target_path` (text) - File or resource path
      - `status` (text) - pending, success, failed, rolled_back
      - `details` (jsonb) - Action details and results
      - `created_at` (timestamptz)
    
    - `file_snapshots`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `file_path` (text) - Relative path to file
      - `content_before` (text) - Content before modification
      - `content_after` (text) - Content after modification
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a local dev tool)
    
  3. Important Notes
    - This is designed for local development use
    - All tables use UUIDs for primary keys
    - Timestamps track creation and updates
    - JSONB fields store flexible metadata
    - Foreign keys maintain referential integrity
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  unity_version text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Session',
  model_provider text NOT NULL DEFAULT 'openai',
  model_name text NOT NULL DEFAULT 'gpt-4',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create execution_logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_path text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create file_snapshots table
CREATE TABLE IF NOT EXISTS file_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  content_before text DEFAULT '',
  content_after text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (local dev tool)
CREATE POLICY "Allow all operations on projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_sessions"
  ON chat_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on messages"
  ON messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on execution_logs"
  ON execution_logs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on file_snapshots"
  ON file_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_session_id ON execution_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_file_snapshots_session_id ON file_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON execution_logs(created_at);