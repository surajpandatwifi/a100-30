import { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ExecutionLog } from '../types';

export default function Terminal() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  useEffect(() => {
    addMockLogs();
  }, []);

  const addMockLogs = () => {
    const mockLogs: ExecutionLog[] = [
      {
        id: '1',
        session_id: 'mock',
        action_type: 'system_init',
        target_path: '',
        status: 'success',
        details: { message: 'Shunya initialized successfully' },
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        session_id: 'mock',
        action_type: 'project_scan',
        target_path: 'Unity Project',
        status: 'success',
        details: { files: 127, scripts: 23 },
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        session_id: 'mock',
        action_type: 'database_connect',
        target_path: 'Supabase',
        status: 'success',
        details: { message: 'Connected to Supabase database' },
        created_at: new Date().toISOString(),
      },
    ];
    setLogs(mockLogs);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'pending':
        return <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900">
        <TerminalIcon className="w-4 h-4 text-emerald-400 mr-2" />
        <span className="text-sm text-slate-300">Execution Log</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 py-1 px-2 hover:bg-slate-900/50 rounded">
            {getStatusIcon(log.status)}
            <span className="text-slate-500">
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
            <span className="text-slate-400">→</span>
            <span className="text-slate-300">{getActionLabel(log.action_type)}</span>
            {log.target_path && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400">{log.target_path}</span>
              </>
            )}
            {log.details.message && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{log.details.message}</span>
              </>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-600">No execution logs yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
