import { supabase } from '../lib/supabase';
import { Project, ChatSession, Message, ExecutionLog, FileSnapshot } from '../types';

export class ApiService {
  static async createProject(data: Partial<Project>): Promise<Project | null> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return project;
  }

  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data || [];
  }

  static async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    return data;
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }

    return data;
  }

  static async deleteProject(id: string): Promise<boolean> {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  }

  static async createChatSession(data: Partial<ChatSession>): Promise<ChatSession | null> {
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      return null;
    }

    return session;
  }

  static async getChatSessions(projectId?: string): Promise<ChatSession[]> {
    let query = supabase.from('chat_sessions').select('*').order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }

    return data || [];
  }

  static async getChatSession(id: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching chat session:', error);
      return null;
    }

    return data;
  }

  static async updateChatSession(
    id: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating chat session:', error);
      return null;
    }

    return data;
  }

  static async deleteChatSession(id: string): Promise<boolean> {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }

    return true;
  }

  static async createMessage(data: Partial<Message>): Promise<Message | null> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    return message;
  }

  static async getMessages(sessionId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }

  static async deleteMessage(id: string): Promise<boolean> {
    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  }

  static async createExecutionLog(data: Partial<ExecutionLog>): Promise<ExecutionLog | null> {
    const { data: log, error } = await supabase
      .from('execution_logs')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating execution log:', error);
      return null;
    }

    return log;
  }

  static async getExecutionLogs(sessionId: string): Promise<ExecutionLog[]> {
    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching execution logs:', error);
      return [];
    }

    return data || [];
  }

  static async updateExecutionLog(
    id: string,
    updates: Partial<ExecutionLog>
  ): Promise<ExecutionLog | null> {
    const { data, error } = await supabase
      .from('execution_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating execution log:', error);
      return null;
    }

    return data;
  }

  static async createFileSnapshot(data: Partial<FileSnapshot>): Promise<FileSnapshot | null> {
    const { data: snapshot, error } = await supabase
      .from('file_snapshots')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating file snapshot:', error);
      return null;
    }

    return snapshot;
  }

  static async getFileSnapshots(sessionId: string): Promise<FileSnapshot[]> {
    const { data, error } = await supabase
      .from('file_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching file snapshots:', error);
      return [];
    }

    return data || [];
  }

  static async getFileSnapshot(
    sessionId: string,
    filePath: string
  ): Promise<FileSnapshot | null> {
    const { data, error } = await supabase
      .from('file_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .eq('file_path', filePath)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching file snapshot:', error);
      return null;
    }

    return data;
  }

  static subscribeToMessages(
    sessionId: string,
    callback: (message: Message) => void
  ): () => void {
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  static subscribeToExecutionLogs(
    sessionId: string,
    callback: (log: ExecutionLog) => void
  ): () => void {
    const channel = supabase
      .channel(`execution_logs:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as ExecutionLog);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
