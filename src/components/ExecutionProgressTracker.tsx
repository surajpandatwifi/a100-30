import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, Clock, AlertTriangle, FileText } from 'lucide-react';
import { ExecutionProgress, OperationResult } from '../services/ai/executionEngine';
import { FileOperation } from '../services/ai/executionPlanner';

interface ExecutionProgressTrackerProps {
  progress: ExecutionProgress;
  onCancel?: () => void;
  onRollback?: () => void;
  showRollback?: boolean;
}

export function ExecutionProgressTracker({
  progress,
  onCancel,
  onRollback,
  showRollback = false
}: ExecutionProgressTrackerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!progress.completedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(progress.startedAt).getTime()) / 1000
        );
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      const elapsed = Math.floor(
        (new Date(progress.completedAt).getTime() - new Date(progress.startedAt).getTime()) / 1000
      );
      setElapsedTime(elapsed);
    }
  }, [progress.startedAt, progress.completedAt]);

  const percentage = Math.round(
    (progress.completedOperations / progress.totalOperations) * 100
  );

  const isComplete = progress.completedAt !== undefined;
  const hasErrors = progress.failedOperations > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Execution Progress</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {progress.completedOperations} of {progress.totalOperations} operations
              </span>
              <span className="text-sm font-medium text-gray-700">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  hasErrors
                    ? 'bg-red-600'
                    : isComplete
                    ? 'bg-green-600'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {progress.currentOperation && !isComplete && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {progress.currentOperation.description}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {progress.currentOperation.targetPath}
                </p>
              </div>
            </div>
          )}

          {isComplete && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${
                hasErrors
                  ? 'bg-red-50'
                  : 'bg-green-50'
              }`}
            >
              {hasErrors ? (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${hasErrors ? 'text-red-900' : 'text-green-900'}`}>
                  {hasErrors
                    ? `Execution failed with ${progress.failedOperations} error(s)`
                    : 'Execution completed successfully'}
                </p>
              </div>
            </div>
          )}

          {progress.failedOperations > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-900">
                {progress.failedOperations} operation(s) failed
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Operations</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {progress.operationResults.map((result, index) => (
                <OperationResultCard key={index} result={result} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {(onCancel || onRollback) && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          {showRollback && onRollback && hasErrors && (
            <button
              onClick={onRollback}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              Rollback Changes
            </button>
          )}
          {onCancel && !isComplete && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface OperationResultCardProps {
  result: OperationResult;
}

function OperationResultCard({ result }: OperationResultCardProps) {
  const getStatusIcon = () => {
    switch (result.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'executing':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'rolled_back':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'executing':
        return 'bg-blue-50 border-blue-200';
      case 'rolled_back':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            Operation {result.operationId}
          </p>
          {result.error && (
            <p className="text-xs text-red-600 mt-1">{result.error}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">
              {result.duration}ms
            </span>
            {result.snapshotId && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Snapshot created
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
