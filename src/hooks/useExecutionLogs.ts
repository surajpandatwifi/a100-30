import { useState, useEffect } from 'react';
import { ExecutionLog } from '../types';
import { ApiService } from '../services/api';

export function useExecutionLogs(sessionId: string | null) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const loadLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await ApiService.getExecutionLogs(sessionId);
        setLogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load execution logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();

    const unsubscribe = ApiService.subscribeToExecutionLogs(sessionId, (newLog) => {
      setLogs((prev) => [...prev, newLog]);
    });

    return unsubscribe;
  }, [sessionId]);

  const addLog = async (
    actionType: string,
    targetPath: string = '',
    status: 'pending' | 'success' | 'failed' | 'rolled_back' = 'pending',
    details: Record<string, any> = {}
  ) => {
    if (!sessionId) return null;

    setError(null);
    const log = await ApiService.createExecutionLog({
      session_id: sessionId,
      action_type: actionType,
      target_path: targetPath,
      status,
      details,
    });

    if (!log) {
      setError('Failed to create execution log');
    }

    return log;
  };

  const updateLogStatus = async (
    logId: string,
    status: 'pending' | 'success' | 'failed' | 'rolled_back',
    details?: Record<string, any>
  ) => {
    setError(null);
    const updated = await ApiService.updateExecutionLog(logId, {
      status,
      ...(details && { details }),
    });

    if (updated) {
      setLogs((prev) => prev.map((log) => (log.id === logId ? updated : log)));
      return updated;
    }

    setError('Failed to update execution log');
    return null;
  };

  return {
    logs,
    loading,
    error,
    addLog,
    updateLogStatus,
  };
}
