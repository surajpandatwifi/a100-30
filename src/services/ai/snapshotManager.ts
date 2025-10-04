import { supabase } from '../../lib/supabase';

export interface Snapshot {
  id: string;
  sessionId: string;
  filePath: string;
  contentBefore: string;
  contentAfter?: string;
  timestamp: string;
  operationId?: string;
  metadata?: Record<string, any>;
}

export interface RollbackResult {
  success: boolean;
  restoredFiles: string[];
  errors: Array<{ file: string; error: string }>;
}

export class SnapshotManager {
  private sessionId: string;
  private localSnapshots: Map<string, Snapshot> = new Map();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async createSnapshot(
    filePath: string,
    content: string,
    operationId?: string,
    metadata?: Record<string, any>
  ): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      filePath,
      contentBefore: content,
      timestamp: new Date().toISOString(),
      operationId,
      metadata
    };

    this.localSnapshots.set(snapshot.id, snapshot);

    try {
      const { error } = await supabase
        .from('file_snapshots')
        .insert({
          session_id: this.sessionId,
          file_path: filePath,
          content_before: content,
          created_at: snapshot.timestamp
        });

      if (error) {
        console.error('Failed to save snapshot to database:', error);
      }
    } catch (error) {
      console.error('Error saving snapshot:', error);
    }

    return snapshot;
  }

  async updateSnapshot(
    snapshotId: string,
    contentAfter: string
  ): Promise<void> {
    const snapshot = this.localSnapshots.get(snapshotId);
    if (snapshot) {
      snapshot.contentAfter = contentAfter;
    }

    try {
      await supabase
        .from('file_snapshots')
        .update({
          content_after: contentAfter,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', this.sessionId)
        .eq('file_path', snapshot?.filePath);
    } catch (error) {
      console.error('Error updating snapshot:', error);
    }
  }

  async getSnapshot(snapshotId: string): Promise<Snapshot | null> {
    const local = this.localSnapshots.get(snapshotId);
    if (local) return local;

    try {
      const { data, error } = await supabase
        .from('file_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        sessionId: data.session_id,
        filePath: data.file_path,
        contentBefore: data.content_before,
        contentAfter: data.content_after,
        timestamp: data.created_at
      };
    } catch (error) {
      console.error('Error fetching snapshot:', error);
      return null;
    }
  }

  async getSnapshotsForFile(filePath: string): Promise<Snapshot[]> {
    try {
      const { data, error } = await supabase
        .from('file_snapshots')
        .select('*')
        .eq('session_id', this.sessionId)
        .eq('file_path', filePath)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        sessionId: item.session_id,
        filePath: item.file_path,
        contentBefore: item.content_before,
        contentAfter: item.content_after,
        timestamp: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching snapshots for file:', error);
      return [];
    }
  }

  async getAllSnapshots(): Promise<Snapshot[]> {
    try {
      const { data, error } = await supabase
        .from('file_snapshots')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        sessionId: item.session_id,
        filePath: item.file_path,
        contentBefore: item.content_before,
        contentAfter: item.content_after,
        timestamp: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching all snapshots:', error);
      return [];
    }
  }

  async rollbackToSnapshot(
    snapshotId: string,
    writeFile: (path: string, content: string) => Promise<void>
  ): Promise<boolean> {
    const snapshot = await this.getSnapshot(snapshotId);
    if (!snapshot) {
      console.error('Snapshot not found:', snapshotId);
      return false;
    }

    try {
      await writeFile(snapshot.filePath, snapshot.contentBefore);

      await supabase
        .from('execution_logs')
        .insert({
          session_id: this.sessionId,
          action_type: 'rollback',
          target_path: snapshot.filePath,
          status: 'success',
          details: {
            snapshotId,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Error rolling back file:', error);

      await supabase
        .from('execution_logs')
        .insert({
          session_id: this.sessionId,
          action_type: 'rollback',
          target_path: snapshot.filePath,
          status: 'failed',
          details: {
            snapshotId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      return false;
    }
  }

  async rollbackMultipleFiles(
    snapshotIds: string[],
    writeFile: (path: string, content: string) => Promise<void>
  ): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: true,
      restoredFiles: [],
      errors: []
    };

    for (const snapshotId of snapshotIds) {
      const snapshot = await this.getSnapshot(snapshotId);
      if (!snapshot) {
        result.errors.push({
          file: 'unknown',
          error: `Snapshot ${snapshotId} not found`
        });
        result.success = false;
        continue;
      }

      try {
        await writeFile(snapshot.filePath, snapshot.contentBefore);
        result.restoredFiles.push(snapshot.filePath);
      } catch (error) {
        result.errors.push({
          file: snapshot.filePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.success = false;
      }
    }

    return result;
  }

  async rollbackSession(
    writeFile: (path: string, content: string) => Promise<void>
  ): Promise<RollbackResult> {
    const snapshots = await this.getAllSnapshots();

    const latestSnapshots = new Map<string, Snapshot>();
    for (const snapshot of snapshots) {
      const existing = latestSnapshots.get(snapshot.filePath);
      if (!existing || new Date(snapshot.timestamp) > new Date(existing.timestamp)) {
        latestSnapshots.set(snapshot.filePath, snapshot);
      }
    }

    const snapshotIds = Array.from(latestSnapshots.values()).map(s => s.id);
    return this.rollbackMultipleFiles(snapshotIds, writeFile);
  }

  async compareSnapshots(
    snapshotId1: string,
    snapshotId2: string
  ): Promise<{ before: string; after: string } | null> {
    const snapshot1 = await this.getSnapshot(snapshotId1);
    const snapshot2 = await this.getSnapshot(snapshotId2);

    if (!snapshot1 || !snapshot2) return null;

    return {
      before: snapshot1.contentBefore,
      after: snapshot2.contentBefore
    };
  }

  async pruneOldSnapshots(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const { data, error } = await supabase
        .from('file_snapshots')
        .delete()
        .eq('session_id', this.sessionId)
        .lt('created_at', cutoffDate.toISOString())
        .select();

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error pruning snapshots:', error);
      return 0;
    }
  }

  async getSnapshotStats(): Promise<{
    totalSnapshots: number;
    totalFiles: number;
    oldestSnapshot: string | null;
    newestSnapshot: string | null;
  }> {
    const snapshots = await this.getAllSnapshots();
    const uniqueFiles = new Set(snapshots.map(s => s.filePath));

    return {
      totalSnapshots: snapshots.length,
      totalFiles: uniqueFiles.size,
      oldestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null,
      newestSnapshot: snapshots.length > 0 ? snapshots[0].timestamp : null
    };
  }

  clearLocalCache(): void {
    this.localSnapshots.clear();
  }
}
