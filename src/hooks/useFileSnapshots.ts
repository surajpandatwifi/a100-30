import { useState, useEffect } from 'react';
import { FileSnapshot } from '../types';
import { ApiService } from '../services/api';

export function useFileSnapshots(sessionId: string | null) {
  const [snapshots, setSnapshots] = useState<FileSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    loadSnapshots();
  }, [sessionId]);

  const loadSnapshots = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.getFileSnapshots(sessionId);
      setSnapshots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file snapshots');
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async (
    filePath: string,
    contentBefore: string,
    contentAfter: string
  ) => {
    if (!sessionId) return null;

    setError(null);
    const snapshot = await ApiService.createFileSnapshot({
      session_id: sessionId,
      file_path: filePath,
      content_before: contentBefore,
      content_after: contentAfter,
    });

    if (snapshot) {
      setSnapshots((prev) => [...prev, snapshot]);
      return snapshot;
    }

    setError('Failed to create file snapshot');
    return null;
  };

  const getSnapshotForFile = async (filePath: string): Promise<FileSnapshot | null> => {
    if (!sessionId) return null;

    setError(null);
    const snapshot = await ApiService.getFileSnapshot(sessionId, filePath);

    if (!snapshot) {
      setError('No snapshot found for file');
    }

    return snapshot;
  };

  const getSnapshotsByPath = (filePath: string): FileSnapshot[] => {
    return snapshots.filter((s) => s.file_path === filePath);
  };

  return {
    snapshots,
    loading,
    error,
    createSnapshot,
    getSnapshotForFile,
    getSnapshotsByPath,
    refresh: loadSnapshots,
  };
}
