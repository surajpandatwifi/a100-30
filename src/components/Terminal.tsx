import { Terminal as TerminalIcon, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useExecutionLogs } from '../hooks/useExecutionLogs';

export default function Terminal() {
  const { currentSession } = useApp();
  const { logs, loading } = useExecutionLogs(currentSession?.id || null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-white" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'pending':
        return <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />;
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
    <div className="h-full flex flex-col bg-black">
      <div className="h-10 border-b border-[#2F4F4F] flex items-center px-4 bg-[#36454F]">
        <TerminalIcon className="w-4 h-4 text-white mr-2" />
        <span className="text-sm text-white">Execution Log</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 py-1 px-2 hover:bg-[#36454F] rounded">
            {getStatusIcon(log.status)}
            <span className="text-gray-500">
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-white">{getActionLabel(log.action_type)}</span>
            {log.target_path && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-white font-medium">{log.target_path}</span>
              </>
            )}
            {log.details.message && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-300">{log.details.message}</span>
              </>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No execution logs yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
